"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { authService } from "../services/authService";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState(user?.email || "");
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleSaveEmail = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSavingEmail(true);
      try {
        await authService.updateProfile(email.trim() || null);
        await refreshUser();
        showToast("Adresse e-mail mise à jour.", "success");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Erreur.", "error");
      } finally {
        setIsSavingEmail(false);
      }
    },
    [email, refreshUser, showToast],
  );

  const handleSavePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
        showToast("Les mots de passe ne correspondent pas.", "error");
        return;
      }
      if (newPassword.length < 6) {
        showToast(
          "Le nouveau mot de passe doit contenir au moins 6 caractères.",
          "error",
        );
        return;
      }
      setIsSavingPassword(true);
      try {
        await authService.updatePassword(currentPassword, newPassword);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        showToast("Mot de passe modifié.", "success");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Erreur.", "error");
      } finally {
        setIsSavingPassword(false);
      }
    },
    [currentPassword, newPassword, confirmPassword, showToast],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4 px-4 py-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Profil</h1>
        <p className="text-sm text-(--text-muted)">
          Connecté en tant que {user?.username}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 min-h-0 gap-4">
        <form
          onSubmit={handleSaveEmail}
          className="crm-card flex flex-col gap-3 h-full"
        >
          <div className="flex items-center gap-2">
            <Image
              src="/icons/profile.webp"
              alt=""
              width={16}
              height={16}
              className="object-contain brightness-0 invert shrink-0"
              unoptimized
            />
            <h2 className="text-base font-bold tracking-tight">
              Adresse e-mail
            </h2>
          </div>
          <div>
            <label className="block text-xs text-(--text-muted) mb-1">
              E-mail
            </label>
            <input
              type="email"
              className="crm-input"
              placeholder="prenom.nom@jean23.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="crm-btn-primary self-start mt-auto"
            disabled={isSavingEmail}
          >
            {isSavingEmail ? "Enregistrement…" : "Enregistrer l'e-mail"}
          </button>
        </form>

        <form
          onSubmit={handleSavePassword}
          className="crm-card flex flex-col gap-3 h-full"
        >
          <div className="flex items-center gap-2">
            <Image
              src="/icons/passwordReset.webp"
              alt=""
              width={16}
              height={16}
              className="object-contain brightness-0 invert shrink-0"
              unoptimized
            />
            <h2 className="text-base font-bold tracking-tight">Mot de passe</h2>
          </div>
          <div>
            <label className="block text-xs text-(--text-muted) mb-1">
              Mot de passe actuel
            </label>
            <input
              type="password"
              className="crm-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-xs text-(--text-muted) mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              className="crm-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-xs text-(--text-muted) mb-1">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              className="crm-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="crm-btn-primary self-start mt-auto"
            disabled={isSavingPassword}
          >
            {isSavingPassword ? "Modification…" : "Modifier le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
