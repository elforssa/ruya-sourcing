import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/auth/login");
  if (session.user.role !== "AGENT" && session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role="AGENT" />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  );
}
