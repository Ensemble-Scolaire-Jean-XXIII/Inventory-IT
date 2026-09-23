"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { User, Column } from "../types/models";
import DataTable from "../components/DataTable";
import RefreshButton from "../components/RefreshButton";
import { userService } from "../services/userService";
import { useAuth } from "../contexts/AuthContext";
import { useSearch } from "../hooks/useSearch";
import { useSort } from "../hooks/useSort";
import { useToast } from "../contexts/ToastContext";

const fullName = (user: User): string =>
  [user.first_name, user.last_name].filter(Boolean).join(" ").trim();

export default function UtilisateursPage() {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await userService.getUsers();
      setUsers(res);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Erreur de chargement.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim();
    const firstNameTrimmed = firstName.trim();
    const lastNameTrimmed = lastName.trim();
    if (!normalizedEmail || !firstNameTrimmed || !lastNameTrimmed) {
      showToast(
        "Le prénom, le nom et l'e-mail sont requis.",
        "error",
      );
      return;
    }
    setIsCreating(true);
    try {
      const res = await userService.createUser({
        email: normalizedEmail,
        first_name: firstNameTrimmed,
        last_name: lastNameTrimmed,
      });
      if (res.temporaryPassword) {
        showToast(
          `Utilisateur créé. SMTP non configuré — mot de passe temporaire : ${res.temporaryPassword}. Communique-le à l'utilisateur.`,
          "info",
          9000,
        );
      } else {
        showToast(
          "Utilisateur créé. Identifiants envoyés par e-mail.",
          "success",
        );
      }
      setFirstName("");
      setLastName("");
      setEmail("");
      await loadUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur.", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    if (!window.confirm(`Supprimer le compte de « ${fullName(target) || target.email} » ?`)) {
      return;
    }
    try {
      await userService.removeUser(String(id));
      showToast("Compte supprimé.", "success");
      await loadUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erreur.", "error");
    }
  };

  const { searchQuery, setSearchQuery, filteredData } = useSearch(users, (u, q) => {
    const haystack = `${u.first_name ?? ""} ${u.last_name ?? ""} ${u.email}`.toLowerCase();
    return haystack.includes(q);
  });
  const { sortField, sortDirection, handleSort } = useSort("last_name", "asc");

  const sorted = [...filteredData].sort((a, b) => {
    const av = String((a as any)[sortField] || "").toLowerCase();
    const bv = String((b as any)[sortField] || "").toLowerCase();
    return sortDirection === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const columns: Column<User>[] = [
    {
      field: "first_name",
      label: "Prénom",
      sortable: true,
      className: "w-[20%]",
      render: (item) => (
        <span className="truncate block">
          {item.first_name || "—"}
          {currentUser?.id === item.id && (
            <span className="ml-2 text-xs text-(--text-muted) font-normal">
              (vous)
            </span>
          )}
        </span>
      ),
    },
    {
      field: "last_name",
      label: "Nom",
      sortable: true,
      className: "w-[20%]",
      render: (item) => <span className="truncate block">{item.last_name || "—"}</span>,
    },
    {
      field: "email",
      label: "E-mail",
      sortable: true,
      className: "w-[35%]",
      render: (item) => (
        <div className="flex items-center gap-2 min-w-0">
          <Image
            src="/icons/users.webp"
            alt=""
            width={14}
            height={14}
            className="object-contain brightness-0 invert shrink-0 opacity-70"
            unoptimized
          />
          <span className="font-medium truncate block">{item.email}</span>
        </div>
      ),
    },
    {
      field: "created_at",
      label: "Créé le",
      sortable: true,
      render: (item) => (
        <span className="text-xs text-(--text-muted)">
          {item.created_at
            ? new Date(item.created_at).toLocaleDateString("fr-FR")
            : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 px-4 py-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-sm text-(--text-muted)">
            Crée des comptes : l'utilisateur reçoit un e-mail avec son mot de
            passe temporaire.
          </p>
        </div>
        <RefreshButton onRefresh={loadUsers} />
      </div>

      <form
        onSubmit={handleCreate}
        className="crm-card p-4 flex flex-col sm:flex-row gap-2 mb-4"
      >
        <input
          type="text"
          className="crm-input flex-1 basis-full sm:basis-0"
          placeholder="Prénom"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          type="text"
          className="crm-input flex-1 basis-full sm:basis-0"
          placeholder="Nom"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <input
          type="email"
          className="crm-input flex-1 basis-full sm:basis-0"
          placeholder="prenom.nom@jean23.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          className="crm-btn-primary shrink-0 text-sm"
          disabled={isCreating}
        >
          <Image
            src="/icons/add.webp"
            alt="Créer"
            width={14}
            height={14}
            className="object-contain brightness-0 invert shrink-0"
            unoptimized
          />
          {isCreating ? "Création…" : "Créer l'utilisateur"}
        </button>
      </form>

      <DataTable<User>
        data={sorted}
        columns={columns}
        keyExtractor={(item) => item.id}
        editingId={null}
        editForm={{}}
        setEditForm={() => {}}
        onEdit={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
        onDelete={handleDelete}
        hideEdit
        isDeletable={(item) => item.id !== currentUser?.id}
        actionsHeader={
          <input
            type="text"
            className="crm-input w-full py-1 text-xs"
            placeholder="Rechercher…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        }
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        isLoading={isLoading}
        emptyMessage="Aucun utilisateur."
        className="flex-1 min-h-0 bg-(--bg-card) border border-(--border-color) rounded-[calc(var(--radius-box)/1.5)]"
      />
    </div>
  );
}