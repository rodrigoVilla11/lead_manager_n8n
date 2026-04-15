"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, AlertCircle, DollarSign, Workflow, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, typeof AlertCircle> = {
  PAYMENT_DUE: DollarSign,
  PAYMENT_OVERDUE: AlertCircle,
  WORKFLOW_ERROR: AlertCircle,
  WORKFLOW_SUCCESS: Workflow,
  INFO: Info,
};

export function NotificationsPopover() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function markAllRead() {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silently fail
    }
  }

  function handleClick(notification: Notification) {
    if (notification.link) {
      router.push(notification.link);
    }
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <button
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
            aria-label="Notificaciones"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={8} className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notificaciones</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={markAllRead}
            >
              <CheckCheck className="mr-1 size-3" />
              Marcar todas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-8 text-sm text-muted-foreground">
              <Bell className="size-6 text-muted-foreground/50" />
              <p>Sin notificaciones</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] ?? Info;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex w-full gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent ${
                      !n.read ? "bg-accent/50" : ""
                    }`}
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.read ? "font-medium" : ""}`}>
                        {n.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#7C3AED]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
