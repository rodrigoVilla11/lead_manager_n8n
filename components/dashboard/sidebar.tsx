"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Zap,
  LayoutDashboard,
  Users,
  GitBranch,
  Mail,
  Settings,
  Moon,
  Sun,
  Menu,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUser } from "@/hooks/use-user";
import type { UserRole } from "@/lib/roles";

interface NavLink {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}

const navLinks: NavLink[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "worker", "client"] },
  { href: "/clients", label: "Clientes", icon: Users, roles: ["admin", "worker"] },
  { href: "/workflows", label: "Workflows", icon: GitBranch, roles: ["admin", "worker"] },
  { href: "/leads", label: "Leads", icon: Mail, roles: ["admin", "worker"] },
  { href: "/users", label: "Usuarios", icon: UserCog, roles: ["admin"] },
  { href: "/settings", label: "Configuracion", icon: Settings, roles: ["admin"] },
];

function SidebarNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { role } = useUser();

  const visibleLinks = navLinks.filter((link) => link.roles.includes(role));

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED] text-white">
          <Zap className="h-4 w-4" />
        </div>
        <span className="text-lg font-semibold tracking-tight">
          Lead Manager Pro
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {visibleLinks.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#7C3AED] text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Dark mode toggle */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          size="default"
          className="w-full justify-start gap-3"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="text-sm">
            {theme === "dark" ? "Modo claro" : "Modo oscuro"}
          </span>
        </Button>
      </div>
    </div>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="lg:hidden" />
        }
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <SidebarNav />
      </SheetContent>
    </Sheet>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background lg:block">
      <SidebarNav />
    </aside>
  );
}
