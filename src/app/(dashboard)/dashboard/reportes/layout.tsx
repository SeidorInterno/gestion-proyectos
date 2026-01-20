import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Roles que pueden ver reportes
const ALLOWED_ROLES = ["MANAGER", "ARQUITECTO_RPA", "ANALISTA_FUNCIONAL"];

export default async function ReportesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // CONSULTOR no puede ver esta página
  if (!session?.user?.roleCode || !ALLOWED_ROLES.includes(session.user.roleCode)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
