import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth/get-user"
import { AdminNav } from "@/components/admin/admin-nav"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication and admin role
  const { profile } = await getUser()

  // Redirect if not admin
  if (profile?.role !== "admin") {
    redirect("/dashboard?error=admin-access-required")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader user={profile} />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}