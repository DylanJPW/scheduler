import type { Lesson, SolveResponse, TimeSlot } from "../../types";
import { getTheme } from "../../utils";
import type { TimeTableProps } from "./types";
import "./TimeTable.css";

interface TimeSlotRowProps {
  timeSlot: TimeSlot;
  lessons: Lesson[];
  minStudents: number;
  maxStudents: number;
}

const LessonCell = ({
  lesson,
  minStudents,
  maxStudents,
}: {
  lesson: Lesson;
  minStudents: number;
  maxStudents: number;
}) => {
  const { teacher, instrument, students } = lesson;
  const { base, light } = getTheme(instrument);
  const count = students?.length ?? 0;
  const tooSmall = count < minStudents;
  const full = count >= maxStudents;

  return (
    <td>
      <div
        className={`border rounded-lg m-2 ${light} ${
          tooSmall ? "ring-2 ring-red-400" : ""
        }`}
      >
        <div className={`cell-header rounded-t-lg ${base}`}>{instrument}</div>
        <div>
          <p>Teacher: {teacher?.name ?? "unassigned"}</p>
          <p>
            Students: {count}
            {tooSmall && (
              <span className="text-red-200 font-semibold">
                {" "}
                — under {minStudents}
              </span>
            )}
            {!tooSmall && full && (
              <span className="text-amber-200"> — full</span>
            )}
          </p>
        </div>
      </div>
    </td>
  );
};

const TimeSlotRow = ({
  timeSlot,
  lessons,
  minStudents,
  maxStudents,
}: TimeSlotRowProps) => {
  const { startTime, endTime } = timeSlot;
  return (
    <tr>
      <td>
        {startTime} - {endTime}
      </td>
      {lessons.map((lesson) => (
        <LessonCell
          key={lesson.id}
          lesson={lesson}
          minStudents={minStudents}
          maxStudents={maxStudents}
        />
      ))}
    </tr>
  );
};

const ResultBanner = ({ result }: { result: SolveResponse }) => {
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
      className={`rounded-t-lg p-2 text-left ${
        result.feasible ? "bg-emerald-800" : "bg-red-800"
      }`}
      role="status"
    >
      <p className="font-semibold">
        {result.feasible
          ? "This timetable satisfies every hard rule."
          : `This timetable BREAKS ${Math.abs(
              result.hardScore,
            )} hard rule(s) — do not use it as-is.`}
      </p>
      <p className="text-sm opacity-80">
        Score {result.score}
        {notes.length > 0 && ` · ${notes.join(" · ")}`}
      </p>
    </div>
  );
};

export const TimeTable = ({
  timeSlotList,
  lessonList,
  result = null,
}: TimeTableProps) => {
  const minStudents = result?.minStudentsPerClass ?? 2;
  const maxStudents = result?.maxStudentsPerClass ?? 6;

  let maxLessons = 0;
  const lessonsByStartTime = lessonList.reduce(
    (acc, lesson) => {
      const key = lesson.timeSlot?.startTime;
      if (!key) return acc;

      if (!acc[key]) acc[key] = [];
      acc[key].push(lesson);
      maxLessons = Math.max(maxLessons, acc[key].length);
      return acc;
    },
    {} as Record<string, Lesson[]>,
  );

  return (
    <div className="w-full border border-table-line rounded-lg">
      {result && <ResultBanner result={result} />}
      <table className="w-full">
        <colgroup>
          <col span={1} className="border-r" />
        </colgroup>
        <thead className="border-b">
          <tr>
            <th>Time</th>
            <th colSpan={Math.max(1, maxLessons)} align="center">
              Classes
            </th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {timeSlotList.map((timeSlot) => (
            <TimeSlotRow
              key={timeSlot.startTime}
              timeSlot={timeSlot}
              lessons={lessonsByStartTime[timeSlot.startTime] ?? []}
              minStudents={minStudents}
              maxStudents={maxStudents}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};