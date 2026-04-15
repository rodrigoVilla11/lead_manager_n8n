"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeadsChartProps {
  data: { date: string; leads: number }[];
}

export function LeadsChart({ data }: LeadsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="rounded-xl bg-white dark:bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Leads por periodo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No hay datos disponibles para mostrar el gráfico.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl bg-white dark:bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Leads por periodo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-popover, #fff)",
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="leads"
                stroke="#7C3AED"
                strokeWidth={2}
                fill="url(#leadsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
