"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      if (!username.trim() || !password) {
        setError("Renseigne un identifiant et un mot de passe.");
        return;
      }
      setIsSubmitting(true);
      try {
        await login(username.trim(), password);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de connexion");
      } finally {
        setIsSubmitting(false);
      }
    },
    [username, password, login],
  );

  return (
    <div className="w-full max-w-md px-6">
      <div className="crm-card">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
            <Image
              src="/j23-logo.webp"
              alt="Logo Jean-XXIII"
              width={44}
              height={44}
              className="object-contain"
              unoptimized
            />
          </div>
          <h1 className="text-xl font-black tracking-tight">
            INVENTORY-IT
          </h1>
          <p className="text-sm text-(--text-muted) text-center">
            Connexion à l'inventaire du parc informatique.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-(--text-muted) mb-1">
              Identifiant
            </label>
            <input
              type="text"
              className="crm-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-(--text-muted) mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              className="crm-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 wrap-break-word">{error}</p>
          )}

          <button
            type="submit"
            className="crm-btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}