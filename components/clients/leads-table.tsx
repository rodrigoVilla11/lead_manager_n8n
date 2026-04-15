"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  FileSpreadsheet,
  ExternalLink,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { downloadCSV } from "@/lib/export-csv";

interface LeadsTableProps {
  clientId: string;
  clientName: string;
  googleSheetUrl: string | null;
  onSetSheetUrl?: (url: string) => void;
  readOnly?: boolean;
}

interface SheetResponse {
  headers: string[];
  rows: Record<string, string>[];
  total: number;
  sheetTitle: string;
  availableSheets: string[];
  page: number;
  limit: number;
  totalPages: number;
}

export function LeadsTable({
  clientId,
  clientName,
  googleSheetUrl,
  onSetSheetUrl,
  readOnly = false,
}: LeadsTableProps) {
  const [data, setData] = useState<SheetResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [activeSheet, setActiveSheet] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(googleSheetUrl ?? "");

  const fetchLeads = useCallback(
    async (p: number, sheet?: string) => {
      if (!googleSheetUrl) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: "50",
        });
        if (sheet) params.set("sheet", sheet);

        const res = await fetch(`/api/clients/${clientId}/leads?${params}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
          if (!sheet && result.sheetTitle) {
            setActiveSheet(result.sheetTitle);
          }
        } else {
          const err = await res.json();
          toast.error(err.error || "Error al cargar leads");
        }
      } catch {
        toast.error("Error al conectar con Google Sheets");
      } finally {
        setLoading(false);
      }
    },
    [clientId, googleSheetUrl],
  );

  useEffect(() => {
    if (googleSheetUrl) {
      fetchLeads(1, undefined);
    }
  }, [fetchLeads, googleSheetUrl]);

  function handleSheetChange(sheet: string) {
    setActiveSheet(sheet);
    setPage(1);
    setSearch("");
    fetchLeads(1, sheet);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    fetchLeads(newPage, activeSheet);
  }

  function handleSaveUrl() {
    onSetSheetUrl?.(urlInput);
    setEditingUrl(false);
  }

  function handleExport() {
    if (!data || data.rows.length === 0) return;
    downloadCSV(
      `leads-${clientName}-${data.sheetTitle}`,
      data.headers,
      data.rows.map((row) => data.headers.map((h) => row[h] ?? "")),
    );
    toast.success("CSV exportado");
  }

  const filteredRows = data?.rows.filter((row) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(row).some((val) => val.toLowerCase().includes(s));
  });

  // No sheet URL
  if (!googleSheetUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-white py-16 dark:bg-card">
        <FileSpreadsheet className="size-10 text-muted-foreground/40" />
        <div className="text-center">
          <p className="font-medium">Sin Google Sheet configurado</p>
          {!readOnly && (
            <p className="text-sm text-muted-foreground">
              Pega la URL del Google Sheet donde se guardan los leads
            </p>
          )}
        </div>
        {!readOnly && (
          <div className="flex w-full max-w-md gap-2 px-4">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="flex-1"
            />
            <Button onClick={handleSaveUrl} disabled={!urlInput.trim()}>
              Guardar
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
   <div className="flex h-full min-w-0 flex-col gap-3 overflow-hidden">
  {/* Toolbar - NUNCA debe moverse */}
  <div className="flex w-full shrink-0 flex-col gap-2 overflow-hidden sm:flex-row sm:items-center sm:justify-between">
    <div className="flex min-w-0 items-center gap-2">
      {data && (
        <Badge variant="outline" className="shrink-0 font-mono text-xs">
          {data.total} filas
        </Badge>
      )}
    </div>
    <div className="flex shrink-0 items-center gap-1.5">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-44 pl-7 text-sm"
        />
      </div>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => fetchLeads(page, activeSheet)}
        disabled={loading}
        aria-label="Refrescar"
      >
        <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
      </Button>
      {data && data.rows.length > 0 && (
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="size-3.5" />
          CSV
        </Button>
      )}
      <Button
        variant="outline"
        size="icon-sm"
        render={
          <a href={googleSheetUrl} target="_blank" rel="noopener noreferrer" />
        }
        aria-label="Abrir Google Sheet"
      >
        <ExternalLink className="size-3.5" />
      </Button>
      {!readOnly && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setEditingUrl(true);
            setUrlInput(googleSheetUrl);
          }}
          aria-label="Cambiar URL"
        >
          <Settings2 className="size-3.5" />
        </Button>
      )}
    </div>
  </div>

  {/* Edit URL */}
  {!readOnly && editingUrl && (
    <div className="flex shrink-0 gap-2">
      <Input
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        placeholder="https://docs.google.com/spreadsheets/d/..."
        className="h-8 min-w-0 flex-1 text-sm"
      />
      <Button size="sm" onClick={handleSaveUrl}>Guardar</Button>
      <Button variant="ghost" size="sm" onClick={() => setEditingUrl(false)}>
        Cancelar
      </Button>
    </div>
  )}

  {/* Sheet tabs */}
  {data && data.availableSheets.length > 1 && (
    <div className="flex shrink-0 gap-1 overflow-x-auto border-b pb-0">
      {data.availableSheets.map((sheet) => (
        <button
          key={sheet}
          onClick={() => handleSheetChange(sheet)}
          className={`whitespace-nowrap border-b-2 px-3 py-1.5 text-sm font-medium transition-colors ${
            activeSheet === sheet
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {sheet}
        </button>
      ))}
    </div>
  )}

  {/* Table container */}
  {loading && !data ? (
    <div className="flex-1 space-y-2 overflow-hidden">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-9 rounded" />
      ))}
    </div>
  ) : data && filteredRows ? (
    /* Este wrapper con max-w-full + overflow-hidden es el que
       impide que la tabla empuje el ancho del layout */
    <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden rounded-xl border bg-white dark:bg-card">
      {/* Scroll horizontal y vertical SOLO acá */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-white dark:bg-card">
            <tr className="border-b">
              <th className="sticky left-0 z-20 bg-white px-3 py-2 text-left text-xs font-semibold text-muted-foreground dark:bg-card">
                #
              </th>
              {data.headers.map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-muted-foreground"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={data.headers.length + 1}
                  className="py-12 text-center text-muted-foreground"
                >
                  {search ? "No se encontraron resultados" : "Sin datos en esta hoja"}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, i) => (
                <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2 text-xs tabular-nums text-muted-foreground dark:bg-card">
                    {(page - 1) * 50 + i + 1}
                  </td>
                  {data.headers.map((header) => (
                    <td
                      key={header}
                      className="max-w-[250px] truncate whitespace-nowrap px-3 py-2"
                      title={row[header] || undefined}
                    >
                      {row[header] || "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer - siempre visible */}
      <div className="flex shrink-0 items-center justify-between border-t px-3 py-2">
        <p className="text-xs text-muted-foreground">
          {data.totalPages > 1
            ? `Página ${data.page} de ${data.totalPages} · ${data.total} filas`
            : `${data.total} filas`}
        </p>
        {data.totalPages > 1 && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handlePageChange(Math.min(data.totalPages, page + 1))}
              disabled={page >= data.totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  ) : null}
</div>
  );
}
