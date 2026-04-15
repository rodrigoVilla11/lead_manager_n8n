import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface WorkflowStatusProps {
  active: boolean;
  size?: "sm" | "default";
}

export function WorkflowStatus({ active, size = "default" }: WorkflowStatusProps) {
  return (
    <Badge
      className={cn(
        "pointer-events-none border-0",
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs",
        active
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400"
      )}
    >
      {active ? "Activo" : "Inactivo"}
    </Badge>
  );
}
