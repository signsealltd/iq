"use client";

import { Archive, ArrowDownUp, Copy, Edit3, Plus, RotateCcw, Search, Trash2, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import type { LookupOption, ManagementResource } from "@/lib/management/config";

type RowValue = unknown;
type Row = Record<string, RowValue> & { id: string; archived?: boolean };
type Payload = { rows: Row[]; lookups: Record<string, LookupOption[]> };

type SortState = { key: string; direction: "asc" | "desc" };

export function ManagementTable({ resource, initialRows, lookups }: { resource: ManagementResource; initialRows: Row[]; lookups: Record<string, LookupOption[]> }) {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [filterKey, setFilterKey] = useState(resource.filters[0]?.key ?? "");
  const [filterValue, setFilterValue] = useState("");
  const [sort, setSort] = useState<SortState>({ key: resource.fields.find((field) => field.showInTable)?.key ?? "id", direction: "asc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [isPending, startTransition] = useTransition();
  const pageSize = 10;

  const visibleFields = resource.fields.filter((field) => field.showInTable).slice(0, 8);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((row) => {
        const matchesQuery = !q || resource.searchable.some((key) => String(row[key] ?? "").toLowerCase().includes(q));
        const matchesFilter = !filterValue || String(row[filterKey] ?? "") === filterValue;
        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => {
        const av = String(a[sort.key] ?? "");
        const bv = String(b[sort.key] ?? "");
        return sort.direction === "asc" ? av.localeCompare(bv, undefined, { numeric: true }) : bv.localeCompare(av, undefined, { numeric: true });
      });
  }, [filterKey, filterValue, query, resource.searchable, rows, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function mutate(body: Record<string, unknown>) {
    const response = await fetch(`/api/management/${resource.key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json() as Partial<Payload> & { error?: string };
    if (!response.ok || data.error || !Array.isArray(data.rows)) throw new Error(data.error ?? "Unable to save changes.");
    setRows(data.rows);
    setSelected([]);
  }

  function run(body: Record<string, unknown>) {
    startTransition(() => {
      mutate(body).catch((error) => window.alert(error instanceof Error ? error.message : "Unable to save changes."));
    });
  }

  function confirmRun(message: string, body: Record<string, unknown>) {
    if (window.confirm(message)) run(body);
  }

  function toggleSort(key: string) {
    setSort((current) => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }));
  }

  return (
    <section className="grid gap-3">
      <div className="panel grid gap-3 p-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-steel" size={16} />
          <input className="w-full pl-9" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={`Search ${resource.title.toLowerCase()}`} />
        </div>
        {resource.filters.length ? (
          <div className="flex gap-2">
            <select value={filterKey} onChange={(event) => setFilterKey(event.target.value)} aria-label="Filter field">
              {resource.filters.map((filter) => <option key={filter.key} value={filter.key}>{filter.label}</option>)}
            </select>
            <select value={filterValue} onChange={(event) => { setFilterValue(event.target.value); setPage(1); }} aria-label="Filter value">
              <option value="">All</option>
              {resource.filters.find((filter) => filter.key === filterKey)?.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        ) : null}
        <button className="button" onClick={() => setEditing(newRecord(resource))}><Plus size={16} /> Add</button>
      </div>

      {selected.length ? (
        <div className="panel flex flex-wrap items-center gap-2 p-3 text-sm">
          <span className="mr-auto text-steel">{selected.length} selected</span>
          <button className="button-secondary" onClick={() => run({ action: "bulk-archive", ids: selected })}><Archive size={16} /> Archive</button>
          <button className="button-secondary" onClick={() => run({ action: "bulk-restore", ids: selected })}><RotateCcw size={16} /> Restore</button>
          <button className="button-secondary" onClick={() => confirmRun("Delete selected records permanently?", { action: "bulk-delete", ids: selected })}><Trash2 size={16} /> Delete</button>
        </div>
      ) : null}

      <div className="panel overflow-hidden">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" checked={pageRows.length > 0 && pageRows.every((row) => selected.includes(row.id))} onChange={(event) => setSelected(event.target.checked ? Array.from(new Set([...selected, ...pageRows.map((row) => row.id)])) : selected.filter((id) => !pageRows.some((row) => row.id === id)))} /></th>
                {visibleFields.map((field) => (
                  <th key={field.key}><button className="inline-flex items-center gap-1" onClick={() => toggleSort(field.key)}>{field.label}<ArrowDownUp size={12} /></button></th>
                ))}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.id} className={row.archived ? "opacity-55" : ""}>
                  <td><input type="checkbox" checked={selected.includes(row.id)} onChange={(event) => setSelected(event.target.checked ? [...selected, row.id] : selected.filter((id) => id !== row.id))} /></td>
                  {visibleFields.map((field) => <td key={field.key}>{formatValue(row[field.key], field.key, lookups)}</td>)}
                  <td>{row.archived ? "Archived" : row.active === false ? "Inactive" : "Active"}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <button className="button-secondary px-2" title="Edit" onClick={() => setEditing(row)}><Edit3 size={15} /></button>
                      <button className="button-secondary px-2" title="Duplicate" onClick={() => run({ action: "duplicate", id: row.id })}><Copy size={15} /></button>
                      <button className="button-secondary px-2" title={row.archived ? "Restore" : "Archive"} onClick={() => run({ action: row.archived ? "restore" : "archive", id: row.id })}>{row.archived ? <RotateCcw size={15} /> : <Archive size={15} />}</button>
                      <button className="button-secondary px-2" title="Delete" onClick={() => confirmRun("Delete this record permanently?", { action: "delete", id: row.id })}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!pageRows.length ? <tr><td colSpan={visibleFields.length + 3} className="text-steel">No records found.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2 border-t border-line p-3 text-sm text-steel sm:flex-row sm:items-center sm:justify-between">
          <span>{filtered.length} records</span>
          <div className="flex items-center gap-2">
            <button className="button-secondary" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            <span>Page {page} of {pages}</span>
            <button className="button-secondary" disabled={page >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>Next</button>
          </div>
        </div>
      </div>

      {editing ? <Editor resource={resource} lookups={lookups} row={editing} busy={isPending} onClose={() => setEditing(null)} onSave={(data) => { run({ action: editing.id ? "update" : "create", id: editing.id, data }); setEditing(null); }} /> : null}
    </section>
  );
}

function newRecord(resource: ManagementResource): Row {
  const row: Row = { id: "" };
  for (const field of resource.fields) {
    if (field.type === "boolean") row[field.key] = true;
    else if (field.type === "number") row[field.key] = 0;
    else if (field.options?.length) row[field.key] = field.options[0]?.value ?? "";
    else row[field.key] = "";
  }
  return row;
}

function formatValue(value: RowValue, key: string, lookups: Record<string, LookupOption[]>) {
  if (key.endsWith("Id") && typeof value === "string") return lookups[key]?.find((option) => option.value === value)?.label ?? value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return value ? String(value).replaceAll("_", " ") : "-";
}

function Editor({ resource, row, lookups, busy, onClose, onSave }: { resource: ManagementResource; row: Row; lookups: Record<string, LookupOption[]>; busy: boolean; onClose: () => void; onSave: (data: Row) => void }) {
  const [draft, setDraft] = useState<Row>(row);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 sm:items-center">
      <form className="panel max-h-[92vh] w-full max-w-4xl overflow-y-auto p-4" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3">
          <div><h2 className="text-lg font-semibold">{row.id ? "Edit" : "Add"} {resource.title}</h2><p className="text-sm text-steel">Changes are saved to the database.</p></div>
          <button className="button-secondary px-3" type="button" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {resource.fields.map((field) => (
            <label key={field.key} className={field.type === "textarea" ? "grid gap-1 md:col-span-2 xl:col-span-3" : "grid gap-1"}>
              <span>{field.label}</span>
              {field.type === "textarea" ? <textarea rows={4} value={String(draft[field.key] ?? "")} onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })} /> : null}
              {field.type === "text" || field.type === "date" || field.type === "number" ? <input required={field.required} type={field.type} step={field.step} value={String(draft[field.key] ?? "")} onChange={(event) => setDraft({ ...draft, [field.key]: field.type === "number" ? Number(event.target.value) : event.target.value })} /> : null}
              {field.type === "boolean" ? <select value={String(draft[field.key] ?? true)} onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value === "true" })}><option value="true">Yes</option><option value="false">No</option></select> : null}
              {field.type === "select" ? <select required={field.required} value={String(draft[field.key] ?? "")} onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}><option value="">Select</option>{(field.options ?? lookups[field.key] ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : null}
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <button className="button-secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="button" disabled={busy} type="submit">{busy ? "Saving" : "Save changes"}</button>
        </div>
      </form>
    </div>
  );
}

