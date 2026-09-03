import { useMemo } from "react";
import { instrumentLabel, type Lesson, type Teacher } from "../../types";
import { findPerson, nameKey, personKey } from "./identity";
import type { ScheduleViewProps } from "./types";

export interface TeacherEvening {
  key: string;
  name: string;
  lessons: Lesson[];
}

export function buildTeacherEvenings(
  lessonList: Lesson[],
  teachers: Teacher[],
): TeacherEvening[] {
  const evenings: TeacherEvening[] = [];
  const byKey = new Map<string, TeacherEvening>();
  const byName = new Map<string, TeacherEvening>();

  const start = (teacher: Teacher): TeacherEvening => {
    const evening: TeacherEvening = {
      key: personKey(teacher),
      name: teacher.name || "(no name)",
      lessons: [],
    };
    evenings.push(evening);
    byKey.set(evening.key, evening);
    if (!byName.has(nameKey(teacher.name))) {
      byName.set(nameKey(teacher.name), evening);
    }
    return evening;
  };

  for (const teacher of teachers) {
    start(teacher);
  }

  for (const lesson of lessonList) {
    const teacher = lesson.teacher;
    if (!teacher) continue;

    const evening = findPerson(teacher, byKey, byName) ?? start(teacher);
    evening.lessons.push(lesson);
  }

  return evenings.sort((a, b) => a.name.localeCompare(b.name));
}

export const ByTeacher = ({
  lessonList,
  timeSlotList,
  teachers,
}: ScheduleViewProps) => {
  const evenings = useMemo(
    () => buildTeacherEvenings(lessonList, teachers),
    [lessonList, teachers],
  );

  if (lessonList.length === 0) {
    return <p className="p-6 opacity-80">Nothing to show until you solve.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-slate-600">
          <tr>
            <th className="text-left px-3 py-2">Teacher</th>
            {timeSlotList.map((slot) => (
              <th
                key={slot.startTime}
                className="text-left px-3 py-2 whitespace-nowrap"
              >
                {slot.startTime}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {evenings.map((evening) => (
            <tr key={evening.key}>
              <th scope="row" className="text-left px-3 py-2 whitespace-nowrap">
                {evening.name}
                {evening.lessons.length === 0 && (
                  <span className="opacity-60 font-normal"> — free all evening</span>
                )}
              </th>
              {timeSlotList.map((slot) => {
                const here = evening.lessons.filter(
                  (lesson) => lesson.timeSlot?.startTime === slot.startTime,
                );
                return (
                  <td key={slot.startTime} className="px-3 py-2 align-top">
                    {here.length === 0 ? (
                      <span className="opacity-30">—</span>
                    ) : (
                      here.map((lesson, index) => (
                        <div key={`${lesson.id ?? "lesson"}-${index}`}>
                          {instrumentLabel(lesson.instrument)}
                          <span className="opacity-70">
                            {" "}
                            ({lesson.students?.length ?? 0})
                          </span>
                          {lesson.room?.name && (
                            <span className="opacity-70 block text-sm">
                              {lesson.room.name}
                            </span>
                          )}
                          {here.length > 1 && (
                            <span className="text-red-300 font-semibold">
                              {" "}
                              clash
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};