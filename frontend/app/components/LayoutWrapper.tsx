"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { ToastProvider } from "../contexts/ToastContext";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Accueil",
    icon: "/icons/dashboard.webp",
    title: "Retour à l'accueil",
  },
  {
    href: "/gabarits",
    label: "Gabarits",
    icon: "/icons/templates.webp",
    title: "Gérer les types d'objets et leurs gabarits de champs",
  },
  {
    href: "/utilisateurs",
    label: "Utilisateurs",
    icon: "/icons/users.webp",
    title: "Gérer les comptes utilisateurs",
  },
  {
    href: "/profil",
    label: "Profil",
    icon: "/icons/profile.webp",
    title: "Gérer l'e-mail et le mot de passe",
  },
];

const CRUMB_LABELS: Record<string, string> = {
  "/": "Accueil",
  "/gabarits": "Gabarits",
  "/utilisateurs": "Utilisateurs",
  "/profil": "Profil",
};

function Header({
  onLogout,
  pathname,
}: {
  onLogout: () => void;
  pathname: string;
}) {
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
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.title}
              className={
                isActive
                  ? "crm-btn-ghost text-xs border-accent/40 bg-accent/15 text-white"
                  : "crm-btn-ghost text-xs"
              }
            >
              <Image
                src={item.icon}
                alt={item.label}
                width={14}
                height={14}
                className="object-contain brightness-0 invert shrink-0"
                unoptimized
              />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
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

function Breadcrumbs({ pathname }: { pathname: string }) {
  const label = CRUMB_LABELS[pathname] || pathname.replace(/^\//, "");
  const crumbs = pathname === "/" ? ["Accueil"] : ["Accueil", label];

  return (
    <nav className="shrink-0 px-5 py-1.5 bg-(--bg-header)/70 backdrop-blur-xl border-b border-(--border-color) flex items-center gap-1.5 text-xs text-(--text-muted) overflow-x-auto custom-scrollbar">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb} className="flex items-center gap-1.5 shrink-0">
            {i > 0 && <span className="opacity-50">/</span>}
            {!isLast ? (
              <Link
                href="/"
                className="hover:text-(--text-main) hover:underline transition-colors"
              >
                {crumb}
              </Link>
            ) : (
              <span
                className={
                  crumbs.length > 1 ? "text-(--accent) font-semibold" : ""
                }
              >
                {crumb}
              </span>
            )}
          </span>
        );
      })}
    </nav>
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
      <Header onLogout={logout} pathname={pathname} />
      {!isLoginPage && <Breadcrumbs pathname={pathname} />}
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