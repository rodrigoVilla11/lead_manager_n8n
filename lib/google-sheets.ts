import { google } from "googleapis";
import path from "path";

function getAuth() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS no esta configurada");
  }

  const absolutePath = path.isAbsolute(keyPath)
    ? keyPath
    : path.join(process.cwd(), keyPath);

  return new google.auth.GoogleAuth({
    keyFile: absolutePath,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? null;
}

export interface SheetData {
  headers: string[];
  rows: Record<string, string>[];
  total: number;
  sheetTitle: string;
  availableSheets: string[];
}

export async function getSheetData(
  spreadsheetId: string,
  sheetName?: string,
  page: number = 1,
  limit: number = 50
): Promise<SheetData> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });

  const availableSheets =
    meta.data.sheets?.map((s) => s.properties?.title ?? "").filter(Boolean) ??
    [];

  const sheetTitle =
    sheetName && availableSheets.includes(sheetName)
      ? sheetName
      : availableSheets[0] ?? "Sheet1";

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetTitle,
    valueRenderOption: "FORMATTED_VALUE",
  });

  const values = response.data.values ?? [];

  if (values.length === 0) {
    return { headers: [], rows: [], total: 0, sheetTitle, availableSheets };
  }

  const headers = values[0].map((h: unknown) => String(h ?? "").trim());
  const allRows = values.slice(1);
  const total = allRows.length;

  const start = (page - 1) * limit;
  const pageRows = allRows.slice(start, start + limit);

  const rows = pageRows.map((row: unknown[]) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = String(row[i] ?? "");
    });
    return obj;
  });

  return { headers, rows, total, sheetTitle, availableSheets };
}

export interface SheetStats {
  total: number;
  withEmail: number;
  withPhone: number;
  withWebsite: number;
  byDate: { date: string; count: number }[];
  topValues: Record<string, { value: string; count: number }[]>;
  headers: string[];
  fillRate: Record<string, number>;
}

/**
 * Analyze all data from a sheet and return stats.
 * Auto-detects email, phone, website, and date columns.
 */
export async function getSheetStats(
  spreadsheetId: string,
  sheetName?: string
): Promise<SheetStats> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });

  const availableSheets =
    meta.data.sheets?.map((s) => s.properties?.title ?? "").filter(Boolean) ?? [];

  const sheetTitle =
    sheetName && availableSheets.includes(sheetName)
      ? sheetName
      : availableSheets[0] ?? "Sheet1";

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetTitle,
    valueRenderOption: "FORMATTED_VALUE",
  });

  const values = response.data.values ?? [];
  if (values.length <= 1) {
    return {
      total: 0,
      withEmail: 0,
      withPhone: 0,
      withWebsite: 0,
      byDate: [],
      topValues: {},
      headers: [],
      fillRate: {},
    };
  }

  const headers = values[0].map((h: unknown) => String(h ?? "").trim());
  const dataRows = values.slice(1);
  const total = dataRows.length;

  // Auto-detect column types by header name
  const emailCols = headers.filter((h) =>
    /email|correo|e-mail|mail/i.test(h)
  );
  const phoneCols = headers.filter((h) =>
    /phone|telefono|teléfono|tel|celular|whatsapp/i.test(h)
  );
  const websiteCols = headers.filter((h) =>
    /website|web|url|sitio|pagina|página|link/i.test(h)
  );
  const dateCols = headers.filter((h) =>
    /date|fecha|timestamp|created|creado/i.test(h)
  );

  function colIndex(name: string): number {
    return headers.indexOf(name);
  }

  function cellValue(row: unknown[], col: string): string {
    const idx = colIndex(col);
    return idx >= 0 ? String(row[idx] ?? "").trim() : "";
  }

  // Count leads with email/phone/website
  let withEmail = 0;
  let withPhone = 0;
  let withWebsite = 0;
  const dateCounts: Record<string, number> = {};
  const columnValues: Record<string, Record<string, number>> = {};
  const columnFilled: Record<string, number> = {};

  // Initialize fill tracking
  headers.forEach((h) => {
    columnFilled[h] = 0;
  });

  for (const row of dataRows) {
    // Email
    if (emailCols.some((col) => cellValue(row, col).includes("@"))) {
      withEmail++;
    }
    // Phone
    if (phoneCols.some((col) => cellValue(row, col).length > 5)) {
      withPhone++;
    }
    // Website
    if (
      websiteCols.some((col) => {
        const v = cellValue(row, col);
        return v.includes(".") && v.length > 4;
      })
    ) {
      withWebsite++;
    }

    // Date grouping
    for (const dateCol of dateCols) {
      const val = cellValue(row, dateCol);
      if (val) {
        // Try to parse date - handle various formats
        const dateKey = normalizeDate(val);
        if (dateKey) {
          dateCounts[dateKey] = (dateCounts[dateKey] ?? 0) + 1;
        }
      }
    }

    // Track fill rate and top values for categorical columns
    headers.forEach((h, idx) => {
      const val = String(row[idx] ?? "").trim();
      if (val) {
        columnFilled[h]++;
        // Track top values for short text columns (likely categories)
        if (val.length < 60 && !emailCols.includes(h) && !phoneCols.includes(h)) {
          if (!columnValues[h]) columnValues[h] = {};
          columnValues[h][val] = (columnValues[h][val] ?? 0) + 1;
        }
      }
    });
  }

  // Build byDate sorted
  const byDate = Object.entries(dateCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Build top values (max 5 per column, only columns with < 20 unique values)
  const topValues: Record<string, { value: string; count: number }[]> = {};
  for (const [col, vals] of Object.entries(columnValues)) {
    const uniqueCount = Object.keys(vals).length;
    if (uniqueCount >= 2 && uniqueCount <= 20) {
      topValues[col] = Object.entries(vals)
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }
  }

  // Fill rate as percentage
  const fillRate: Record<string, number> = {};
  headers.forEach((h) => {
    fillRate[h] = total > 0 ? Math.round((columnFilled[h] / total) * 100) : 0;
  });

  return {
    total,
    withEmail,
    withPhone,
    withWebsite,
    byDate,
    topValues,
    headers,
    fillRate,
  };
}

function normalizeDate(val: string): string | null {
  // Try common date formats
  // dd/mm/yyyy, mm/dd/yyyy, yyyy-mm-dd, etc.
  const d = new Date(val);
  if (!isNaN(d.getTime()) && d.getFullYear() > 2000) {
    return d.toISOString().split("T")[0];
  }
  // Try dd/mm/yyyy
  const parts = val.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    if (c > 2000) {
      // dd/mm/yyyy
      const date = new Date(c, b - 1, a);
      if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
    }
  }
  return null;
}
