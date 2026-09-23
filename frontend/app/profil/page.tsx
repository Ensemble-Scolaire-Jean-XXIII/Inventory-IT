"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { authService } from "../services/authService";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

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
          Gérez vos informations personnelles et votre mot de passe.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 min-h-0 gap-4">
        <div className="crm-card flex flex-col h-full">
          <div className="flex items-center gap-2 p-4 border-b border-(--border-color)">
            <Image
              src="/icons/profile.webp"
              alt=""
              width={16}
              height={16}
              className="object-contain brightness-0 invert shrink-0"
              unoptimized
            />
            <h2 className="text-base font-bold tracking-tight">
              Informations
            </h2>
          </div>
          <div className="flex-1 flex flex-col justify-evenly px-4 py-6 gap-3">
            <div className="text-center">
              <p className="text-xs text-(--text-muted) uppercase tracking-wider mb-0.5">
                Prénom
              </p>
              <p className="text-lg font-medium text-(--text-main)">
                {user?.first_name || "—"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-(--text-muted) uppercase tracking-wider mb-0.5">
                Nom
              </p>
              <p className="text-lg font-medium text-(--text-main)">
                {user?.last_name || "—"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-(--text-muted) uppercase tracking-wider mb-0.5">
                Adresse e-mail
              </p>
              <p className="text-lg font-medium text-(--text-main) truncate max-w-xs mx-auto">
                {user?.email || "—"}
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSavePassword}
          className="crm-card flex flex-col gap-3 h-full"
        >
          <div className="flex items-center gap-2 p-4 border-b border-(--border-color)">
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
          <div className="flex-1 flex flex-col justify-center px-4 space-y-4">
            <div>
              <label className="block text-xs text-(--text-muted) mb-1.5 text-center">
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
              <label className="block text-xs text-(--text-muted) mb-1.5 text-center">
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
              <label className="block text-xs text-(--text-muted) mb-1.5 text-center">
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
            <div className="pt-2 text-right">
              <button
                type="submit"
                className="crm-btn-primary w-full sm:w-auto"
                disabled={isSavingPassword}
              >
                {isSavingPassword ? "Modification…" : "Modifier le mot de passe"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}