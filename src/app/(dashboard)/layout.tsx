import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPaletteProvider } from "@/components/command-palette-provider";
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider";
import { SkipLink } from "@/components/ui/skip-link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SkipLink />
      <Sidebar userRoleCode={session.user.roleCode} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          userName={session.user.name || "Usuario"}
          userEmail={session.user.email || ""}
          userRoleName={session.user.roleName}
        />
        <main id="main-content" className="flex-1 overflow-auto bg-slate-50 p-6 dark:bg-slate-900" tabIndex={-1}>
          <DynamicBreadcrumbs />
          {children}
        </main>
      </div>
      <CommandPaletteProvider />
      <KeyboardShortcutsProvider />
    </div>
  );
}
