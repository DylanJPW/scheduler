import { useState } from "react";
import type { BrokenRule, SolveResponse } from "../../types";
import { TimeTable } from "./TimeTable";
import { ByStudent } from "./ByStudent";
import { ByTeacher } from "./ByTeacher";
import { Families } from "./Families";
import type { ScheduleViewProps } from "./types";
import "./TimeTable.css";

interface ScheduleViewsProps extends ScheduleViewProps {
  result: SolveResponse | null;
}

type ViewKey = "grid" | "student" | "teacher";

const VIEWS: { key: ViewKey; label: string; blurb: string }[] = [
  { key: "grid", label: "The evening", blurb: "Every class, room by room" },
  { key: "student", label: "By student", blurb: "What each family needs to know" },
  { key: "teacher", label: "By teacher", blurb: "Each teacher's evening" },
];

const ResultBanner = ({
  result,
  brokenRules,
  selectedRule,
  onSelectRule,
}: {
  result: SolveResponse;
  brokenRules: BrokenRule[];
  selectedRule: string | null;
  onSelectRule: (constraintName: string | null) => void;
}) => {
  const notes: string[] = [];
  if (result.emptyClassCount > 0) {
    notes.push(
      `${result.emptyClassCount} empty class${
        result.emptyClassCount === 1 ? "" : "es"
      } dropped`,
    );
  }
  if (result.unusedMinutes > 0) {
    notes.push(`${result.unusedMinutes} min of the evening unused`);
  }

  return (
    <div
      className={`p-3 text-left ${
        result.feasible ? "bg-emerald-800" : "bg-red-800"
      }`}
      role="status"
    >
      <p className="font-semibold">
        {result.feasible
          ? "This timetable satisfies every hard rule."
          : `This timetable breaks ${Math.abs(result.hardScore)} hard rule${
              Math.abs(result.hardScore) === 1 ? "" : "s"
            } — do not use it as-is.`}
      </p>
      <p className="text-sm opacity-80">
        Score {result.score}
        {notes.length > 0 && ` · ${notes.join(" · ")}`}
      </p>

      {brokenRules.length > 0 && (
        <ul className="pt-3 flex flex-col gap-1 print:hidden">
          {brokenRules.map((rule) => {
            const isActive = selectedRule === rule.constraintName;
            const canShow = rule.lessonIds.length > 0;
            const people = rule.studentKeys.length + rule.teacherKeys.length;

            return (
              <li key={rule.constraintName}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  className={`text-left underline cursor-pointer ${
                    isActive ? "text-amber-200" : ""
                  }`}
                  onClick={() =>
                    onSelectRule(isActive ? null : rule.constraintName)
                  }
                >
                  {rule.description}
                  {canShow && (
                    <span className="opacity-70">
                      {" "}
                      — {isActive ? "hide" : "show me"}
                      {people > 0 &&
                        ` (${people} ${people === 1 ? "person" : "people"})`}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export const ScheduleViews = ({
  timeSlotList,
  roomList,
  lessonList,
  students,
  teachers,
  result,
}: ScheduleViewsProps) => {
  const [view, setView] = useState<ViewKey>("grid");
  const [selectedRule, setSelectedRule] = useState<string | null>(null);

  const brokenRules = result?.brokenRules ?? [];
  const solved = lessonList.length > 0;

  const active = brokenRules.find((rule) => rule.constraintName === selectedRule);

  return (
    <section className="w-full border border-slate-600 rounded-lg printable">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 print:hidden">
        <h2 className="text-2xl font-semibold text-left">
          <span className="opacity-70">5.</span> The schedule
        </h2>
        <button
          type="button"
          className="rounded-lg px-4 py-2 bg-slate-700 hover:bg-slate-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!solved}
          // The browser's own print dialog offers "Save as PDF" on every
          // desktop platform, which is the entire feature, for one line.
          onClick={() => window.print()}
        >
          Print / save as PDF
        </button>
      </div>

      {result && (
        <ResultBanner
          result={result}
          brokenRules={brokenRules}
          selectedRule={selectedRule}
          onSelectRule={setSelectedRule}
        />
      )}

      <div className="flex flex-wrap gap-2 p-3 print:hidden" role="tablist">
        {VIEWS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            role="tab"
            aria-selected={view === entry.key}
            title={entry.blurb}
            className={`rounded-lg px-4 py-2 cursor-pointer ${
              view === entry.key
                ? "bg-blue-800"
                : "bg-slate-700 hover:bg-slate-600"
            }`}
            onClick={() => setView(entry.key)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {!solved && (
        <p className="px-3 pb-3 opacity-80 text-left print:hidden">
          Press Solve to fill this in. The times below are the evening you have
          set up.
        </p>
      )}

      {view === "grid" && (
        <TimeTable
          timeSlotList={timeSlotList}
          roomList={roomList}
          lessonList={lessonList}
          result={result}
          highlightedLessonIds={active?.lessonIds ?? []}
          highlightedStudentKeys={active?.studentKeys ?? []}
          highlightedTeacherKeys={active?.teacherKeys ?? []}
        />
      )}
      {view === "student" && (
        <ByStudent
          lessonList={lessonList}
          timeSlotList={timeSlotList}
          roomList={roomList}
          students={students}
          teachers={teachers}
        />
      )}
      {view === "teacher" && (
        <ByTeacher
          lessonList={lessonList}
          timeSlotList={timeSlotList}
          roomList={roomList}
          students={students}
          teachers={teachers}
        />
      )}

      {view === "grid" && (
        <div className="p-3">
          <Families lessonList={lessonList} timeSlotList={timeSlotList} />
        </div>
      )}
    </section>
  );
};