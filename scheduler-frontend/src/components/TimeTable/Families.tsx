import type { Lesson, TimeSlot } from "../../types";

interface FamiliesProps {
  lessonList: Lesson[];
  timeSlotList: TimeSlot[];
}

interface FamilyMember {
  name: string;
  startTime: string;
}

export interface Family {
  id: string;
  members: FamilyMember[];
  spreadInSlots: number;
}

export function buildFamilies(
  lessonList: Lesson[],
  timeSlotList: TimeSlot[],
): Family[] {
  const slotIndexByStartTime = new Map(
    timeSlotList.map((slot, index) => [slot.startTime, index]),
  );

  const membersByFamily = new Map<string, FamilyMember[]>();

  for (const lesson of lessonList) {
    const startTime = lesson.timeSlot?.startTime;
    if (!startTime) continue;

    for (const student of lesson.students ?? []) {
      const familyId = student.familyId?.trim().toLowerCase();
      if (!familyId) continue;

      const members = membersByFamily.get(familyId) ?? [];
      members.push({ name: student.name, startTime });
      membersByFamily.set(familyId, members);
    }
  }

  return [...membersByFamily.entries()]
    // One child on their own is not a sibling problem, however the box was filled in.
    .filter(([, members]) => members.length > 1)
    .map(([id, members]) => {
      const indexes = members
        .map((member) => slotIndexByStartTime.get(member.startTime))
        .filter((index): index is number => index !== undefined);

      return {
        id,
        members: [...members].sort((a, b) =>
          a.startTime.localeCompare(b.startTime),
        ),
        spreadInSlots:
          indexes.length > 1 ? Math.max(...indexes) - Math.min(...indexes) : 0,
      };
    })
    // Worst offenders first: those are the families she may have to ring about.
    .sort(
      (a, b) => b.spreadInSlots - a.spreadInSlots || a.id.localeCompare(b.id),
    );
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const Families = ({ lessonList, timeSlotList }: FamiliesProps) => {
  const families = buildFamilies(lessonList, timeSlotList);
  if (families.length === 0) return null;

  const splitCount = families.filter(
    (family) => family.spreadInSlots > 0,
  ).length;

  return (
    <div className="w-full border rounded-lg">
      <div className="rounded-t-lg p-2 text-left bg-slate-800">
        <p className="font-semibold">Families</p>
        <p className="text-sm opacity-80">
          {splitCount === 0
            ? `All ${families.length} together.`
            : `${splitCount} of ${families.length} split across the evening.`}
        </p>
      </div>

      <table className="w-full">
        <tbody className="divide-y">
          {families.map((family) => (
            <tr className="bg-slate-700" key={family.id}>
              <td className="text-start px-4 py-2 font-semibold">
                {titleCase(family.id)}
              </td>
              <td className="text-start px-4 py-2">
                {family.members
                  .map((member) => `${member.name} (${member.startTime})`)
                  .join(", ")}
              </td>
              <td className="text-start px-4 py-2 whitespace-nowrap">
                {family.spreadInSlots === 0 ? (
                  <span className="text-emerald-300">Together</span>
                ) : (
                  <span className="text-amber-200">
                    {family.spreadInSlots} slot
                    {family.spreadInSlots === 1 ? "" : "s"} apart
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};