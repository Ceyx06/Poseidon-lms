import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CoordinatorShell from "@/components/coordinator/CoordinatorShell";

export default async function CoordinatorDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as any)?.role;
  if (role !== "COORDINATOR" && role !== "ADMIN") redirect("/login");

  return (
    <CoordinatorShell user={session.user}>
      {children}
    </CoordinatorShell>
  );
}
