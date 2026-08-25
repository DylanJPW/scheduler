import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ColDef,
  EntityId,
  Highlight,
  InputType,
  KeyValue,
  WithId,
} from "./types";
import { getTheme } from "../../utils";
import { Select } from "../shared/Select";
import type { TimeSlot } from "../../types";

interface InputAccordionProps<T extends WithId> {
  label: string;
  step?: string;
  listKey: "students" | "teachers";
  items: T[];
  colDefs: ColDef[];
  onChange: (items: T[]) => void;
  makeBlank: () => T;
  familyIds?: string[];
  highlight?: Highlight | null;
}

interface UndoState<T> {
  item: T;
  index: number;
  description: string;
}

const UNDO_MS = 10_000;

function optionLabel(options: KeyValue[] | undefined, key: string): string {
  return options?.find((o) => o.key === key)?.value ?? key;
}

function searchText<T extends WithId>(item: T, colDefs: ColDef[]): string {
  const parts: string[] = [];
  for (const col of colDefs) {
    const raw = (item as Record<string, unknown>)[col.field];
    if (raw == null) continue;

    if (col.type === "multiSelect" && Array.isArray(raw)) {
      parts.push(raw.map((key: string) => optionLabel(col.options, key)).join(" "));
    } else if (col.type === "select" && typeof raw === "string") {
      parts.push(optionLabel(col.options, raw));
    } else if (col.type === "timeRange") {
      const range = raw as TimeSlot;
      if (range?.startTime) parts.push(`${range.startTime} ${range.endTime}`);
    } else if (typeof raw === "string") {
      parts.push(raw);
    }
  }
  return parts.join(" ").toLowerCase();
}

function sortValue<T extends WithId>(item: T, col: ColDef): string {
  const raw = (item as Record<string, unknown>)[col.field];
  if (raw == null) return "";
  if (col.type === "multiSelect" && Array.isArray(raw)) {
    return raw.map((key: string) => optionLabel(col.options, key)).join(", ");
  }
  if (col.type === "select" && typeof raw === "string") {
    return optionLabel(col.options, raw);
  }
  if (col.type === "timeRange") return (raw as TimeSlot)?.startTime ?? "";
  return typeof raw === "string" ? raw : String(raw);
}

export const InputAccordion = <T extends object & WithId>({
  label,
  step,
  listKey,
  items,
  colDefs,
  onChange,
  makeBlank,
  familyIds = [],
  highlight = null,
}: InputAccordionProps<T>) => {
  const { dark, base, light } = getTheme(label);
  const id = `${label}-accordion`;
  const familyListId = `${label}-family-ids`;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [undo, setUndo] = useState<UndoState<T> | null>(null);
  const [focusId, setFocusId] = useState<EntityId | null>(null);

  const [order, setOrder] = useState<EntityId[] | null>(null);
  const [sortedBy, setSortedBy] = useState<{ field: string; dir: 1 | -1 } | null>(
    null,
  );

  const [pinned, setPinned] = useState<{ ids: EntityId[]; note: string } | null>(
    null,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const undoTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!highlight || highlight.list !== listKey) return;
    setIsOpen(true);
    setQuery("");
    setPinned({ ids: highlight.entityIds, note: highlight.note });
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [highlight, listKey]);

  useEffect(() => {
    return () => {
      if (undoTimer.current !== null) window.clearTimeout(undoTimer.current);
    };
  }, []);

  const rows = useMemo(() => {
    let visible = items;

    if (pinned) {
      const wanted = new Set(pinned.ids);
      visible = visible.filter((item) => wanted.has(item.id));
    }

    const trimmed = query.trim().toLowerCase();
    if (trimmed) {
      visible = visible.filter((item) =>
        searchText(item, colDefs).includes(trimmed),
      );
    }

    if (order) {
      const position = new Map(order.map((entityId, index) => [entityId, index]));
      visible = [...visible].sort(
        (a, b) =>
          (position.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
          (position.get(b.id) ?? Number.MAX_SAFE_INTEGER),
      );
    }

    return visible;
  }, [items, colDefs, query, order, pinned]);

  const edit = (updated: T) => {
    onChange(items.map((item) => (item.id === updated.id ? updated : item)));
  };

  const setField = (item: T, field: string, value: unknown) => {
    edit({ ...item, [field]: value });
  };

  const remove = (item: T) => {
    const index = items.findIndex((candidate) => candidate.id === item.id);
    onChange(items.filter((candidate) => candidate.id !== item.id));

    const name = (item as { name?: string }).name?.trim();
    setUndo({
      item,
      index,
      description: name ? `Removed ${name}` : "Removed a row",
    });

    if (undoTimer.current !== null) window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndo(null), UNDO_MS);
  };

  const undoRemove = () => {
    if (!undo) return;
    const restored = [...items];
    restored.splice(Math.min(undo.index, restored.length), 0, undo.item);
    onChange(restored);
    setUndo(null);
    if (undoTimer.current !== null) window.clearTimeout(undoTimer.current);
  };

  const add = () => {
    const item = makeBlank();
    onChange([...items, item]);
    setQuery("");
    setPinned(null);
    setFocusId(item.id);
  };

  const toggleSort = (col: ColDef) => {
    const dir: 1 | -1 = sortedBy?.field === col.field && sortedBy.dir === 1 ? -1 : 1;
    const sorted = [...items].sort(
      (a, b) => sortValue(a, col).localeCompare(sortValue(b, col)) * dir,
    );
    setOrder(sorted.map((item) => item.id));
    setSortedBy({ field: col.field, dir });
  };

  const clearSort = () => {
    setOrder(null);
    setSortedBy(null);
  };

  const renderInput = (item: T, col: ColDef) => {
    const raw = (item as Record<string, unknown>)[col.field];
    const type: InputType = col.type ?? "text";
    const fieldLabel = `${col.name} for ${(item as { name?: string }).name || "new row"}`;

    if (type === "select") {
      return (
        <select
          aria-label={fieldLabel}
          className={`w-full rounded-lg px-2 py-0.5 ${dark}`}
          value={(raw as string) ?? ""}
          onChange={(e) => setField(item, col.field, e.target.value)}
        >
          <option value="">—</option>
          {(col.options ?? []).map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.value}
            </option>
          ))}
        </select>
      );
    }

    if (type === "multiSelect") {
      return (
        <Select
          label={fieldLabel}
          options={col.options ?? []}
          value={(raw as string[]) ?? []}
          onChange={(val) => setField(item, col.field, val)}
        />
      );
    }

    if (type === "timeRange") {
      const range = (raw as TimeSlot) ?? { startTime: "", endTime: "" };
      return (
        <div className="flex flex-row items-center">
          <input
            aria-label={`${fieldLabel} from`}
            className={`rounded-lg px-2 py-0.5 ${dark}`}
            type="time"
            value={range.startTime ?? ""}
            onChange={(e) =>
              setField(item, col.field, { ...range, startTime: e.target.value })
            }
          />
          <p className="px-2">—</p>
          <input
            aria-label={`${fieldLabel} until`}
            className={`rounded-lg px-2 py-0.5 ${dark}`}
            type="time"
            value={range.endTime ?? ""}
            onChange={(e) =>
              setField(item, col.field, { ...range, endTime: e.target.value })
            }
          />
        </div>
      );
    }

    return (
      <input
        aria-label={fieldLabel}
        value={(raw as string) ?? ""}
        list={type === "family" ? familyListId : undefined}
        className={`w-full rounded-lg px-2 py-0.5 ${dark}`}
        ref={
          col.field === "name"
            ? (element: HTMLInputElement | null) => {
                if (element && focusId === item.id) {
                  element.focus();
                  setFocusId(null);
                }
              }
            : undefined
        }
        onChange={(e) => setField(item, col.field, e.target.value)}
      />
    );
  };

  const filtering = query.trim() !== "" || pinned !== null;

  return (
    <div className="w-full" ref={containerRef}>
      <button
        type="button"
        id={id}
        aria-expanded={isOpen}
        className={`w-full flex justify-between items-center gap-4 px-4 ${base} rounded-lg py-2 ${
          isOpen ? "rounded-b-none" : ""
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold">
          {step && <span className="opacity-70 font-normal">{step} </span>}
          {label} ({items.length})
          {filtering && (
            <span className="font-normal opacity-80"> · showing {rows.length}</span>
          )}
        </span>
        <span aria-hidden="true">{isOpen ? "▴" : "▾"}</span>
      </button>

      {isOpen && (
        <div className="rounded-b-lg">
          <div
            className={`flex flex-wrap items-center gap-2 px-4 py-2 ${dark}`}
          >
            <input
              type="search"
              aria-label={`Search ${label.toLowerCase()}`}
              placeholder={`Search ${label.toLowerCase()}…`}
              className="rounded-lg px-2 py-1 bg-slate-900/40 border border-slate-400 min-w-56 grow"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {sortedBy && (
              <button
                type="button"
                className="rounded-lg px-3 py-1 bg-slate-800 hover:bg-slate-700 cursor-pointer"
                onClick={clearSort}
              >
                Clear sort
              </button>
            )}
          </div>

          {pinned && (
            <div className="flex items-center justify-between gap-4 px-4 py-2 bg-amber-900 text-sm">
              <span>{pinned.note}</span>
              <button
                type="button"
                className="underline cursor-pointer whitespace-nowrap"
                onClick={() => setPinned(null)}
              >
                Show all {items.length}
              </button>
            </div>
          )}

          <div
            className="max-h-[70vh] overflow-auto rounded-b-lg
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:bg-neutral-700 [&::-webkit-scrollbar-track]:rounded-lg
            [&::-webkit-scrollbar-thumb]:bg-neutral-500 [&::-webkit-scrollbar-thumb]:rounded-lg"
          >
            <table className="w-full">
              <thead>
                <tr>
                  {colDefs.map((col) => {
                    const active = sortedBy?.field === col.field;
                    return (
                      <th
                        className={`sticky top-0 ${dark} text-start px-2 py-2`}
                        key={col.field}
                        aria-sort={
                          active
                            ? sortedBy.dir === 1
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                      >
                        {col.sortable === false ? (
                          col.name
                        ) : (
                          <button
                            type="button"
                            className="cursor-pointer hover:underline"
                            onClick={() => toggleSort(col)}
                          >
                            {col.name}
                            <span aria-hidden="true">
                              {active ? (sortedBy.dir === 1 ? " ▲" : " ▼") : ""}
                            </span>
                          </button>
                        )}
                      </th>
                    );
                  })}
                  <th className={`sticky top-0 ${dark} text-start px-2 py-2`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 && (
                  <tr className={light}>
                    <td
                      colSpan={colDefs.length + 1}
                      className="px-4 py-6 text-center opacity-80"
                    >
                      {items.length === 0
                        ? `No ${label.toLowerCase()} yet — press Add to start one.`
                        : "No rows match that search."}
                    </td>
                  </tr>
                )}

                {rows.map((item) => {
                  const isHighlighted = pinned?.ids.includes(item.id) ?? false;
                  return (
                    <tr
                      className={`${light} ${
                        isHighlighted ? "outline-2 outline-amber-300" : ""
                      }`}
                      key={item.id}
                    >
                      {colDefs.map((col) => (
                        <td
                          key={`${item.id}-${col.field}`}
                          className="text-start px-2 py-2"
                        >
                          {renderInput(item, col)}
                        </td>
                      ))}
                      <td className="px-2">
                        <button
                          type="button"
                          onClick={() => remove(item)}
                          className="w-24 bg-red-800 rounded-lg p-1 hover:bg-red-700 cursor-pointer transition-[background-color] duration-250"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}

                <tr className={light}>
                  <td colSpan={colDefs.length}></td>
                  <td className="px-2">
                    <button
                      type="button"
                      className="w-24 bg-blue-800 rounded-lg my-2 p-1 hover:bg-blue-700 cursor-pointer transition-[background-color] duration-250"
                      onClick={add}
                    >
                      Add
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <datalist id={familyListId}>
            {familyIds.map((familyId) => (
              <option key={familyId} value={familyId} />
            ))}
          </datalist>
        </div>
      )}

      {undo && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-900 border border-slate-500 rounded-lg px-4 py-2 shadow-lg"
        >
          <span>{undo.description}</span>
          <button
            type="button"
            className="underline cursor-pointer"
            onClick={undoRemove}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
};