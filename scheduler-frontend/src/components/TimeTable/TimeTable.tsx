import { instrumentLabel, type Lesson, type TimeSlot } from "../../types";
import { getTheme } from "../../utils";
import type { TimeTableProps } from "./types";
import "./TimeTable.css";

interface TimeSlotRowProps {
  timeSlot: TimeSlot;
  lessons: Lesson[];
  minStudents: number;
  maxStudents: number;
  columns: number;
  highlightedLessonIds: number[];
}

const LessonCell = ({
  lesson,
  minStudents,
  maxStudents,
  isHighlighted,
}: {
  lesson: Lesson;
  minStudents: number;
  maxStudents: number;
  isHighlighted: boolean;
}) => {
  const { teacher, instrument, students } = lesson;
  const { base, light } = getTheme(instrument);
  const count = students?.length ?? 0;
  const tooSmall = count < minStudents;
  const full = count >= maxStudents;

  return (
    <td className="align-top">
      <div
        className={`border rounded-lg m-2 ${light} ${
          isHighlighted
            ? "ring-4 ring-amber-300"
            : tooSmall
              ? "ring-2 ring-red-400"
              : ""
        }`}
      >
        <div className={`cell-header rounded-t-lg ${base} px-2 py-1`}>
          {instrumentLabel(instrument) + " - " + (teacher?.name ?? "unassigned")}
        </div>
        <div className="px-2 py-1 text-left">
          <p>{}</p>

          {count === 0 ? (
            <p className="opacity-70 italic">empty</p>
          ) : (
            <ul>
              {students.map((student, index) => (
                <li key={`${lesson.id ?? "lesson"}-${index}`}>{student.name}</li>
              ))}
            </ul>
          )}

          <p className="text-sm opacity-80 pt-1">
            {count} student{count === 1 ? "" : "s"}
            {tooSmall && (
              <span className="text-red-200 font-semibold">
                {" "}
                — under {minStudents}
              </span>
            )}
            {!tooSmall && full && <span className="text-amber-200"> — full</span>}
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
  columns,
  highlightedLessonIds,
}: TimeSlotRowProps) => {
  const { startTime, endTime } = timeSlot;
  const padding = Math.max(0, columns - lessons.length);

  return (
    <tr>
      <th scope="row" className="align-top px-2 py-2 whitespace-nowrap text-left">
        {startTime} – {endTime}
      </th>
      {lessons.map((lesson) => (
        <LessonCell
          key={lesson.id}
          lesson={lesson}
          minStudents={minStudents}
          maxStudents={maxStudents}
          isHighlighted={highlightedLessonIds.includes(lesson.id)}
        />
      ))}
      {Array.from({ length: padding }, (_, index) => (
        <td key={`pad-${index}`} />
      ))}
    </tr>
  );
};

export const TimeTable = ({
  timeSlotList,
  lessonList,
  result = null,
  highlightedLessonIds = [],
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

  if (timeSlotList.length === 0) {
    return (
      <p className="p-6 opacity-80">
        No class times yet — check the start time, end time and class length above.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-slate-600">
          <tr>
            <th className="text-left px-2 py-2">Time</th>
            <th colSpan={Math.max(1, maxLessons)} className="text-left px-2 py-2">
              Classes
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-700">
          {timeSlotList.map((timeSlot) => (
            <TimeSlotRow
              key={timeSlot.startTime}
              timeSlot={timeSlot}
              lessons={lessonsByStartTime[timeSlot.startTime] ?? []}
              minStudents={minStudents}
              maxStudents={maxStudents}
              columns={Math.max(1, maxLessons)}
              highlightedLessonIds={highlightedLessonIds}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};