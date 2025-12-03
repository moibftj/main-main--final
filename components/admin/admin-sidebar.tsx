"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Mail,
  Users,
  UserCheck,
  Users2,
  Ticket,
  DollarSign,
  CreditCard,
  BarChart3,
  Menu,
  X
} from "lucide-react"
import { useState } from "react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  superUserOnly?: boolean
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard
  },
  {
    title: "Letters",
    href: "/admin/letters",
    icon: Mail,
    badge: "Review Queue"
  },
  {
    title: "Subscribers",
    href: "/admin/subscribers",
    icon: UserCheck
  },
  {
    title: "All Users",
    href: "/admin/users",
    icon: Users
  },
  {
    title: "Employees",
    href: "/admin/employees",
    icon: Users2,
    superUserOnly: true
  },
  {
    title: "Coupons",
    href: "/admin/coupons",
    icon: Ticket,
    superUserOnly: true
  },
  {
    title: "Commissions",
    href: "/admin/commissions",
    icon: DollarSign,
    superUserOnly: true
  },
  {
    title: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3
  }
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // TODO: Get user role from auth context
  const isSuperUser = true // This should come from auth state

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mb-4"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>

        <nav className="space-y-2">
          {navItems.map((item) => {
            // Skip super user only items if not super user
            if (item.superUserOnly && !isSuperUser) {
              return null
            }

            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}