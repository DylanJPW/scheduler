import { useEffect, useMemo, useRef, useState } from "react";
import { instrumentLabel, skillLevelLabel, type Student } from "../../types";
import { parseGrid } from "../../import/grid";
import {
  countRowsWithNotes,
  describeDate,
  mapStudents,
  type StudentField,
} from "../../import/students";
import {
  INSTRUMENT_NAMES,
  SKILL_LEVEL_NAMES,
  downloadText,
  templateCsv,
} from "../../import/template";

export type ImportMode = "replace" | "append";

interface ImportStudentsDialogProps {
  existingCount: number;
  onClose: () => void;
  onImport: (students: Student[], mode: ImportMode) => void;
}

const FIELD_LABELS: Record<StudentField, string> = {
  name: "Name",
  instrument: "Instrument",
  skillLevel: "Skill Level",
  familyId: "Family",
  dateOfBirth: "Date of Birth",
  preferredStart: "Preferred Start",
  preferredEnd: "Preferred End",
  preferredRange: "Preferred Time",
};

const PREVIEW_ROWS = 50;
const MAX_NOTES_SHOWN = 50;

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

export const ImportStudentsDialog = ({
  existingCount,
  onClose,
  onImport,
}: ImportStudentsDialogProps) => {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<ImportMode>(
    existingCount === 0 ? "replace" : "append",
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const preview = useMemo(() => {
    if (text.trim() === "") return null;
    return mapStudents(parseGrid(text));
  }, [text]);

  const rowsWithNotes = preview ? countRowsWithNotes(preview.notes) : 0;
  const ready = preview?.students.length ?? 0;

  const ignoredHeaders =
    preview?.columns
      .filter((column) => column.field === null && column.header !== "")
      .map((column) => column.header) ?? [];

  const recognised =
    preview?.columns.filter((column) => column.field !== null) ?? [];

  const missing = (Object.keys(FIELD_LABELS) as StudentField[]).filter(
    (field) =>
      field !== "preferredRange" &&
      field !== "preferredStart" &&
      field !== "preferredEnd" &&
      !recognised.some((column) => column.field === field),
  );

  const commit = () => {
    if (!preview || preview.students.length === 0) return;
    if (
      mode === "replace" &&
      existingCount > 0 &&
      !window.confirm(
        `Replace the ${existingCount} ${plural(existingCount, "student", "students")} already listed with these ${preview.students.length}?`,
      )
    ) {
      return;
    }
    onImport(preview.students, mode);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-students-title"
        className="flex w-full max-w-4xl max-h-[90dvh] flex-col rounded-lg bg-slate-800 border border-slate-500 shadow-xl"
      >
        <div className="shrink-0 flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-600">
          <div>
            <h2 id="import-students-title" className="text-xl font-semibold">
              Import students from a spreadsheet
            </h2>
            <p className="opacity-80 text-sm pt-1">
              Open your sheet in Excel or Google Sheets, select the heading row
              and all the student rows below it, copy, and paste here. Nothing
              changes until you press Import.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-lg px-3 py-1 bg-slate-700 hover:bg-slate-600 cursor-pointer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button
              type="button"
              className="underline cursor-pointer"
              onClick={() =>
                downloadText("students-template.csv", templateCsv(), "text/csv")
              }
            >
              Download a blank template
            </button>
            <span className="opacity-70">
              Columns: {Object.values(FIELD_LABELS).slice(0, 5).join(", ")},
              Preferred Start, Preferred End
            </span>
          </div>

          <textarea
            ref={textareaRef}
            aria-label="Paste your spreadsheet rows"
            placeholder={
              "Name\tInstrument\tSkill Level\tFamily\tDate of Birth\n" +
              "Aoife Ní Bhriain\tFiddle\tBeginner\tNí Bhriain\t03/09/2015"
            }
            className="w-full h-32 shrink-0 rounded-lg p-3 font-mono text-sm bg-slate-900/60 border border-slate-500"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />

          {preview?.fatal && (
            <p className="rounded-lg bg-red-900/60 border border-red-500 px-4 py-3">
              {preview.fatal}
            </p>
          )}

          {preview && !preview.fatal && (
            <>
              <div className="rounded-lg bg-slate-900/60 border border-slate-600 px-4 py-3 flex flex-col gap-2 text-sm">
                <p className="text-base">
                  <strong>{preview.rowsRead}</strong>{" "}
                  {plural(preview.rowsRead, "row", "rows")} read ·{" "}
                  <strong>{ready}</strong> ready to import
                  {rowsWithNotes > 0 && (
                    <>
                      {" "}
                      · <strong>{rowsWithNotes}</strong> with something to check
                    </>
                  )}
                  {preview.skipped.length > 0 && (
                    <>
                      {" "}
                      · <strong>{preview.skipped.length}</strong> skipped
                    </>
                  )}
                </p>

                <p className="opacity-80">
                  Using row {preview.headerLine} as the headings:{" "}
                  {recognised
                    .map(
                      (column) =>
                        `${column.header} → ${FIELD_LABELS[column.field as StudentField]}`,
                    )
                    .join(" · ")}
                </p>

                {ignoredHeaders.length > 0 && (
                  <p className="opacity-80">
                    Ignoring {ignoredHeaders.join(", ")}.
                  </p>
                )}

                {missing.length > 0 && (
                  <p className="opacity-80">
                    No column found for{" "}
                    {missing.map((field) => FIELD_LABELS[field]).join(", ")} —
                    those will be blank and you can fill them in afterwards.
                  </p>
                )}
              </div>

              {(preview.notes.length > 0 || preview.skipped.length > 0) && (
                <div className="rounded-lg bg-amber-900/50 border border-amber-500 px-4 py-3 text-sm">
                  <p className="font-semibold pb-1">
                    Worth a look before you import
                  </p>
                  <ul className="list-disc pl-5 flex flex-col gap-1 max-h-40 overflow-y-auto">
                    {[...preview.skipped, ...preview.notes]
                      .slice(0, MAX_NOTES_SHOWN)
                      .map((note, index) => (
                        <li key={`${note.line}-${index}`}>
                          <span className="opacity-70">Row {note.line}</span>
                          {note.who && <> · {note.who}</>} — {note.message}
                        </li>
                      ))}
                  </ul>
                  {preview.notes.length + preview.skipped.length >
                    MAX_NOTES_SHOWN && (
                    <p className="pt-2 opacity-80">
                      …and{" "}
                      {preview.notes.length +
                        preview.skipped.length -
                        MAX_NOTES_SHOWN}{" "}
                      more.
                    </p>
                  )}
                  <p className="pt-2 opacity-80">
                    These rows still come in — the parts I could not read are
                    left blank, and the checks above the Solve button will point
                    at them.
                  </p>
                </div>
              )}

              {ready > 0 && (
                <div className="max-h-64 overflow-auto rounded-lg border border-slate-600">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {[
                          "Name",
                          "Instrument",
                          "Skill Level",
                          "Family",
                          "Date of Birth",
                          "Preferred Time",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="sticky top-0 text-start px-3 py-2 bg-slate-900"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.students.slice(0, PREVIEW_ROWS).map((student) => (
                        <tr key={student.id} className="border-t border-slate-700">
                          <td className="px-3 py-1.5">{student.name}</td>
                          <td className="px-3 py-1.5">
                            {student.instrument ? (
                              instrumentLabel(student.instrument)
                            ) : (
                              <span className="opacity-50">—</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5">
                            {student.skillLevel ? (
                              skillLevelLabel(student.skillLevel)
                            ) : (
                              <span className="opacity-50">—</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5">
                            {student.familyId ?? (
                              <span className="opacity-50">—</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5">
                            {student.dateOfBirth ? (
                              describeDate(student.dateOfBirth)
                            ) : (
                              <span className="opacity-50">—</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5">
                            {student.preferredTimeRange ? (
                              `${student.preferredTimeRange.startTime}–${student.preferredTimeRange.endTime}`
                            ) : (
                              <span className="opacity-50">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {ready > 0 && (
                <p className="text-sm opacity-80">
                  {ready > PREVIEW_ROWS
                    ? `Showing the first ${PREVIEW_ROWS} of ${ready}. `
                    : ""}
                  Dates are spelled out here on purpose — check one you know
                  before importing.
                </p>
              )}
            </>
          )}

          <p className="text-xs opacity-70">
            Instruments: {INSTRUMENT_NAMES.join(", ")}. Skill levels:{" "}
            {SKILL_LEVEL_NAMES.join(", ")}. Dates are read day first
            (03/09/2015 is 3 September).
          </p>
        </div>

        <div className="shrink-0 flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-t border-slate-600">
          <fieldset className="flex flex-wrap items-center gap-4 text-sm">
            <legend className="sr-only">What to do with the current list</legend>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="import-mode"
                checked={mode === "append"}
                onChange={() => setMode("append")}
              />
              Add to the {existingCount} already listed
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="import-mode"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
              />
              Replace the whole list
            </label>
          </fieldset>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg px-4 py-2 bg-slate-700 hover:bg-slate-600 cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={ready === 0}
              className="rounded-lg px-4 py-2 bg-blue-800 hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={commit}
            >
              {ready === 0
                ? "Nothing to import yet"
                : `Import ${ready} ${plural(ready, "student", "students")}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
