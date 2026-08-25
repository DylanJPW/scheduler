import { useMemo } from "react";
import {
  instrumentLabel,
  type EntityId,
  type Lesson,
  type Student,
} from "../../types";
import { hasId, nameKey } from "./identity";
import type { ScheduleViewProps } from "./types";

interface Placement {
  id: EntityId | undefined;
  name: string;
  familyId: string;
  instrument: string;
  teacherName: string;
  startTime: string;
  endTime: string;
}

export function buildPlacements(lessonList: Lesson[]): Placement[] {
  const placements: Placement[] = [];

  for (const lesson of lessonList) {
    for (const student of lesson.students ?? []) {
      placements.push({
        id: student.id,
        name: student.name,
        familyId: student.familyId?.trim().toLowerCase() ?? "",
        instrument: lesson.instrument,
        teacherName: lesson.teacher?.name ?? "unassigned",
        startTime: lesson.timeSlot?.startTime ?? "",
        endTime: lesson.timeSlot?.endTime ?? "",
      });
    }
  }

  return placements.sort((a, b) => {
    if (a.familyId !== b.familyId) {
      if (!a.familyId) return 1;
      if (!b.familyId) return -1;
      return a.familyId.localeCompare(b.familyId);
    }
    return (
      a.startTime.localeCompare(b.startTime) || a.name.localeCompare(b.name)
    );
  });
}

export function findUnplaced(
  students: Student[],
  placements: Placement[],
): Student[] {
  const placedIds = new Set<EntityId>();
  const placedNames = new Set<string>();

  for (const placement of placements) {
    if (hasId(placement.id)) placedIds.add(placement.id);
    placedNames.add(nameKey(placement.name));
  }

  return students.filter(
    (student) =>
      !(hasId(student.id) && placedIds.has(student.id)) &&
      !placedNames.has(nameKey(student.name)),
  );
}

export const ByStudent = ({ lessonList, students }: ScheduleViewProps) => {
  const placements = useMemo(() => buildPlacements(lessonList), [lessonList]);
  const unplaced = useMemo(
    () => findUnplaced(students, placements),
    [students, placements],
  );

  if (placements.length === 0) {
    return <p className="p-6 opacity-80">Nothing to show until you solve.</p>;
  }

  let lastFamily: string | null = null;

  return (
    <div className="overflow-x-auto">
      {unplaced.length > 0 && (
        <div className="m-3 p-3 border border-red-400 rounded-lg text-left">
          <p className="font-semibold text-red-200">
            {unplaced.length} student{unplaced.length === 1 ? "" : "s"} did not get
            a class
          </p>
          <p className="text-sm pt-1">
            {unplaced.map((student) => student.name || "(no name)").join(", ")}
          </p>
        </div>
      )}

      <table className="w-full">
        <thead className="border-b border-slate-600">
          <tr>
            <th className="text-left px-3 py-2">Student</th>
            <th className="text-left px-3 py-2">Family</th>
            <th className="text-left px-3 py-2">Instrument</th>
            <th className="text-left px-3 py-2">Time</th>
            <th className="text-left px-3 py-2">Teacher</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {placements.map((placement, index) => {
            const startsNewFamily =
              placement.familyId !== "" && placement.familyId !== lastFamily;
            lastFamily = placement.familyId;

            return (
              <tr
                key={`${nameKey(placement.name)}-${index}`}
                className={startsNewFamily ? "border-t-2 border-t-slate-500" : ""}
              >
                <td className="text-left px-3 py-2">{placement.name}</td>
                <td className="text-left px-3 py-2 opacity-80">
                  {placement.familyId || "—"}
                </td>
                <td className="text-left px-3 py-2">
                  {instrumentLabel(placement.instrument)}
                </td>
                <td className="text-left px-3 py-2 whitespace-nowrap">
                  {placement.startTime} – {placement.endTime}
                </td>
                <td className="text-left px-3 py-2">{placement.teacherName}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};