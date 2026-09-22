"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { ToastProvider } from "../contexts/ToastContext";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

function Header({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="flex items-center justify-between gap-4 px-5 py-3 bg-(--bg-header) backdrop-blur-xl border-b border-(--border-color) shrink-0 z-40">
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
            <Image
              src="/j23-logo.webp"
              alt="Logo Jean-XXIII"
              width={28}
              height={28}
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="min-w-0 hidden sm:block">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-lg tracking-wider text-white leading-none">
                INVENTORY-IT
              </span>
            </div>
            <span className="hidden lg:block text-xs text-(--text-muted) leading-tight">
              Ensemble Scolaire Jean XXIII
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link href="/" className="crm-btn-ghost text-xs" title="Retour à l'accueil">
          <Image
            src="/icons/dashboard.webp"
            alt="Accueil"
            width={14}
            height={14}
            className="object-contain brightness-0 invert shrink-0"
            unoptimized
          />
          <span className="hidden md:inline">Accueil</span>
        </Link>
        <Link href="/gabarits" className="crm-btn-ghost text-xs" title="Gérer les types d'objets et leurs gabarits de champs">
          <Image
            src="/icons/templates.webp"
            alt="Gabarits"
            width={14}
            height={14}
            className="object-contain brightness-0 invert shrink-0"
            unoptimized
          />
          <span className="hidden md:inline">Gabarits</span>
        </Link>
        <Link href="/utilisateurs" className="crm-btn-ghost text-xs" title="Gérer les comptes utilisateurs">
          <Image
            src="/icons/users.webp"
            alt="Utilisateurs"
            width={14}
            height={14}
            className="object-contain brightness-0 invert shrink-0"
            unoptimized
          />
          <span className="hidden md:inline">Utilisateurs</span>
        </Link>
        <Link href="/profil" className="crm-btn-ghost text-xs" title="Gérer l'e-mail et le mot de passe">
          <Image
            src="/icons/profile.webp"
            alt="Profil"
            width={14}
            height={14}
            className="object-contain brightness-0 invert shrink-0"
            unoptimized
          />
          <span className="hidden md:inline">Profil</span>
        </Link>
        <button
          onClick={onLogout}
          className="crm-btn-ghost text-xs"
          title="Déconnexion"
        >
          <Image
            src="/icons/logout.webp"
            alt="Déconnexion"
            width={14}
            height={14}
            className="object-contain brightness-0 invert shrink-0"
            unoptimized
          />
          <span className="hidden md:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}

function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/connexion";
  const { isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isLoginPage && !isAuthenticated) {
      router.replace("/connexion");
    }
  }, [isLoading, isLoginPage, isAuthenticated, router]);

  if (isLoginPage || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {isLoading ? (
          <span className="text-(--text-muted)">Chargement…</span>
        ) : (
          children
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header onLogout={logout} />
      <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
        {children}
      </main>
    </div>
  );
}

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <AuthProvider>
        <LayoutInner>{children}</LayoutInner>
      </AuthProvider>
    </ToastProvider>
  );
}