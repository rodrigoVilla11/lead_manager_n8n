import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
}: StatsCardProps) {
  return (
    <Card className="rounded-xl bg-white dark:bg-card">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]/10 text-[#7C3AED]">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium",
                trend.positive ? "text-emerald-600" : "text-red-600"
              )}
            >
              {trend.positive ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {trend.value}%
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
