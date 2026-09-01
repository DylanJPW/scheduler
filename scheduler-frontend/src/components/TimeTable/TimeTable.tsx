import {
  instrumentLabel,
  type Lesson,
  type Room,
  type TimeSlot,
} from "../../types";
import { ASSUMED_MAX_CLASS_SIZE, ASSUMED_MIN_CLASS_SIZE } from "../../constants";
import { getTheme } from "../../utils";
import { personKey, roomKey } from "./identity";
import type { TimeTableProps } from "./types";
import "./TimeTable.css";

export function cellKey(startTime: string, room: string): string {
  return `${startTime}|${room}`;
}

export interface RoomGrid {
  byCell: Map<string, Lesson[]>;
  elsewhere: Lesson[];
}

export function buildRoomGrid(lessonList: Lesson[], roomList: Room[]): RoomGrid {
  const knownRooms = new Set(roomList.map((room) => roomKey(room)));
  const byCell = new Map<string, Lesson[]>();
  const elsewhere: Lesson[] = [];

  for (const lesson of lessonList) {
    const startTime = lesson.timeSlot?.startTime;
    const room = roomKey(lesson.room);

    if (!startTime || !room || !knownRooms.has(room)) {
      elsewhere.push(lesson);
      continue;
    }

    const key = cellKey(startTime, room);
    const bucket = byCell.get(key);
    if (bucket) {
      bucket.push(lesson);
    } else {
      byCell.set(key, [lesson]);
    }
  }

  return { byCell, elsewhere };
}

const NAMED = "bg-amber-300/25 rounded px-1 -mx-1 font-semibold";

const LessonCard = ({
  lesson,
  minStudents,
  maxStudents,
  isHighlighted,
  namedStudentKeys,
  namedTeacherKeys,
}: {
  lesson: Lesson;
  minStudents: number;
  maxStudents: number;
  isHighlighted: boolean;
  namedStudentKeys: Set<string>;
  namedTeacherKeys: Set<string>;
}) => {
  const { teacher, instrument, students } = lesson;
  const { base, light } = getTheme(instrument);
  const count = students?.length ?? 0;
  const tooSmall = count < minStudents;
  const full = count >= maxStudents;
  const teacherNamed = namedTeacherKeys.has(personKey(teacher));

  return (
    <div
      className={`border rounded-lg ${light} ${
        isHighlighted
          ? "ring-4 ring-amber-300"
          : tooSmall
            ? "ring-2 ring-red-400"
            : ""
      }`}
    >
      <div className={`cell-header rounded-t-lg ${base} px-2 py-1`}>
        {instrumentLabel(instrument)} -{" "}
        <span className={teacherNamed ? NAMED : ""}>
          {teacher?.name ?? "unassigned"}
        </span>
      </div>
      <div className="px-2 py-1 text-left">
        {count === 0 ? (
          <p className="opacity-70 italic">empty</p>
        ) : (
          <ul>
            {students.map((student, index) => {
              const named = namedStudentKeys.has(personKey(student));
              return (
                <li key={`${lesson.id ?? "lesson"}-${index}`}>
                  <span className={named ? NAMED : ""}>{student.name}</span>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-sm opacity-80 pt-1">
          {count} student{count === 1 ? "" : "s"}
          {tooSmall && (
            <span className="text-red-200 font-semibold"> — under {minStudents}</span>
          )}
          {!tooSmall && full && <span className="text-amber-200"> — full</span>}
        </p>
      </div>
    </div>
  );
};

export const TimeTable = ({
  timeSlotList,
  roomList,
  lessonList,
  result = null,
  highlightedLessonIds = [],
  highlightedStudentKeys = [],
  highlightedTeacherKeys = [],
}: TimeTableProps) => {
  const minStudents = result?.minStudentsPerClass ?? ASSUMED_MIN_CLASS_SIZE;
  const maxStudents = result?.maxStudentsPerClass ?? ASSUMED_MAX_CLASS_SIZE;

  const namedStudentKeys = new Set(highlightedStudentKeys);
  const namedTeacherKeys = new Set(highlightedTeacherKeys);

  const { byCell, elsewhere } = buildRoomGrid(lessonList, roomList);

  if (timeSlotList.length === 0) {
    return (
      <p className="p-6 opacity-80">
        No class times yet — check the start time, end time and class length above.
      </p>
    );
  }

  if (roomList.length === 0) {
    return (
      <p className="p-6 opacity-80">
        No rooms yet — add one row per place a class can run, and they become the columns
        here.
      </p>
    );
  }

  const renderCell = (timeSlot: TimeSlot, room: Room) => {
    const lessons = byCell.get(cellKey(timeSlot.startTime, roomKey(room))) ?? [];
    const clash = lessons.length > 1;

    return (
      <td
        key={`${timeSlot.startTime}-${roomKey(room)}`}
        className="align-top p-2"
      >
        {clash && (
          <p className="text-red-200 font-semibold text-sm pb-1" role="alert">
            {lessons.length} classes in this room at once
          </p>
        )}
        <div className="flex flex-col gap-2">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              minStudents={minStudents}
              maxStudents={maxStudents}
              isHighlighted={highlightedLessonIds.includes(lesson.id)}
              namedStudentKeys={namedStudentKeys}
              namedTeacherKeys={namedTeacherKeys}
            />
          ))}
        </div>
      </td>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-slate-600">
          <tr>
            <th className="text-left px-2 py-2">Time</th>
            {roomList.map((room) => (
              <th key={roomKey(room)} className="text-left px-2 py-2">
                {room.name || "Room"}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-700">
          {timeSlotList.map((timeSlot) => (
            <tr key={timeSlot.startTime}>
              <th
                scope="row"
                className="align-top px-2 py-2 whitespace-nowrap text-left"
              >
                {timeSlot.startTime} – {timeSlot.endTime}
              </th>
              {roomList.map((room) => renderCell(timeSlot, room))}
            </tr>
          ))}
        </tbody>
      </table>

      {elsewhere.length > 0 && (
        <div className="p-3 text-left" role="alert">
          <p className="text-amber-200 font-semibold">
            {elsewhere.length} class{elsewhere.length === 1 ? "" : "es"} could not be placed
            on this grid
          </p>
          <ul className="text-sm opacity-90">
            {elsewhere.map((lesson) => (
              <li key={lesson.id}>
                {instrumentLabel(lesson.instrument)} with{" "}
                {lesson.teacher?.name ?? "no teacher"} —{" "}
                {lesson.timeSlot?.startTime
                  ? `no room`
                  : `no time slot`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};