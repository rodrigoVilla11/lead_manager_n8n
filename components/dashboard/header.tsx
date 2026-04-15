"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings } from "lucide-react";
import { MobileSidebar } from "@/components/dashboard/sidebar";
import { toast } from "sonner";
import { NotificationsPopover } from "@/components/dashboard/notifications-popover";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/clients": "Clientes",
  "/workflows": "Workflows",
  "/leads": "Leads",
  "/settings": "Configuracion",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const match = Object.entries(pageTitles).find(
    ([path]) => path !== "/" && pathname.startsWith(path)
  );
  return match ? match[1] : "Dashboard";
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Error al cerrar sesion");
    }
  }

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur lg:px-6">
      <MobileSidebar />
      <h1 className="text-lg font-semibold">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <NotificationsPopover />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end" sideOffset={8}>
            {userEmail && (
              <>
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{userEmail}</p>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
            >
              <Settings className="size-4" />
              Configuracion
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Cerrar Sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
