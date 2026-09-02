import { describeEvening } from "./evening";
import {
  instrumentLabel,
  type EntityId,
  type Room,
  type Student,
  type Teacher,
} from "./types";
import type { TimeSlotParams } from "./components/InputPage/types";

export type ProblemSeverity = "error" | "warning";
export type ProblemList = "students" | "teachers" | "rooms";

export interface Problem {
  id: string;
  severity: ProblemSeverity;
  message: string;
  list?: ProblemList;
  entityIds?: EntityId[];
}

export interface ValidationInput {
  students: Student[];
  teachers: Teacher[];
  rooms: Room[];
  timeSlotParams: TimeSlotParams;
  maxClassSize: number;
}

function blank(value: string | undefined): boolean {
  return !value || value.trim() === "";
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

export function validateInput({
  students,
  teachers,
  rooms,
  timeSlotParams,
  maxClassSize,
}: ValidationInput): Problem[] {
  const problems: Problem[] = [];

  const evening = describeEvening(timeSlotParams);
  if (evening.problem) {
    problems.push({
      id: "evening",
      severity: "error",
      message: evening.problem,
    });
  }

  if (students.length === 0) {
    problems.push({
      id: "no-students",
      severity: "error",
      message: "There are no students yet. Add or import some.",
      list: "students",
    });
  }
  if (teachers.length === 0) {
    problems.push({
      id: "no-teachers",
      severity: "error",
      message: "There are no teachers yet. Add or import some.",
      list: "teachers",
    });
  }

  if (rooms.length === 0) {
    problems.push({
      id: "no-rooms",
      severity: "error",
      message:
        "There are no rooms yet. Add one row per place a class can run - two classes can never share a room at the same time, so this is also what decides how many classes run at once.",
      list: "rooms",
    });
  }

  /* ---------------------------------------------------------- blank fields */

  const namelessStudents = students.filter((s) => blank(s.name));
  if (namelessStudents.length > 0) {
    problems.push({
      id: "student-no-name",
      severity: "error",
      message: `${namelessStudents.length} ${plural(namelessStudents.length, "student has", "students have")} no name.`,
      list: "students",
      entityIds: namelessStudents.map((s) => s.id),
    });
  }

  const instrumentless = students.filter((s) => blank(s.instrument));
  if (instrumentless.length > 0) {
    problems.push({
      id: "student-no-instrument",
      severity: "error",
      message: `${instrumentless.length} ${plural(instrumentless.length, "student has", "students have")} no instrument, so ${plural(instrumentless.length, "they cannot", "they cannot")} be put in a class.`,
      list: "students",
      entityIds: instrumentless.map((s) => s.id),
    });
  }

  const levelless = students.filter((s) => blank(s.skillLevel));
  if (levelless.length > 0) {
    problems.push({
      id: "student-no-level",
      severity: "warning",
      message: `${levelless.length} ${plural(levelless.length, "student has", "students have")} no skill level. The solver ignores level for now, but you will want these filled in before classes are split by level.`,
      list: "students",
      entityIds: levelless.map((s) => s.id),
    });
  }

  /* ------------------------------------------------------- dates of birth */

  const withoutDob = students.filter((s) => blank(s.dateOfBirth));
  if (withoutDob.length > 0) {
    const nobodyHasOne = withoutDob.length === students.length;
    problems.push({
      id: "student-no-dob",
      severity: "warning",
      message: nobodyHasOne
        ? "No student has a date of birth, so nothing is pulling younger students earlier in the evening. Fill the column in, or leave it if age does not matter this year."
        : `${withoutDob.length} ${plural(withoutDob.length, "student has", "students have")} no date of birth. They are still scheduled, but the rule that puts younger students earlier in the evening will pass over them.`,
      list: "students",
      entityIds: nobodyHasOne ? undefined : withoutDob.map((s) => s.id),
    });
  }

  const impossibleDob = students.filter((s) => {
    if (blank(s.dateOfBirth)) return false;
    const born = new Date(`${s.dateOfBirth}T00:00:00`);
    if (Number.isNaN(born.getTime())) return true;
    return born > new Date();
  });
  if (impossibleDob.length > 0) {
    problems.push({
      id: "student-bad-dob",
      severity: "error",
      message: `${impossibleDob.length} ${plural(impossibleDob.length, "student has a date", "students have dates")} of birth that cannot be right - check for a mistyped year.`,
      list: "students",
      entityIds: impossibleDob.map((s) => s.id),
    });
  }

  const implausibleAge = students.filter((s) => {
    if (blank(s.dateOfBirth)) return false;
    const born = new Date(`${s.dateOfBirth}T00:00:00`);
    if (Number.isNaN(born.getTime()) || born > new Date()) return false;
    return born < new Date("1900-01-01T00:00:00");
  });
  if (implausibleAge.length > 0) {
    problems.push({
      id: "student-old-dob",
      severity: "warning",
      message: `${implausibleAge.length} ${plural(implausibleAge.length, "student has a date", "students have dates")} of birth before 1900. That is almost certainly a typo.`,
      list: "students",
      entityIds: implausibleAge.map((s) => s.id),
    });
  }

  const namelessTeachers = teachers.filter((t) => blank(t.name));
  if (namelessTeachers.length > 0) {
    problems.push({
      id: "teacher-no-name",
      severity: "error",
      message: `${namelessTeachers.length} ${plural(namelessTeachers.length, "teacher has", "teachers have")} no name.`,
      list: "teachers",
      entityIds: namelessTeachers.map((t) => t.id),
    });
  }

  const emptyTeachers = teachers.filter((t) => (t.instruments ?? []).length === 0);
  if (emptyTeachers.length > 0) {
    problems.push({
      id: "teacher-no-instruments",
      severity: "warning",
      message: `${emptyTeachers.length} ${plural(emptyTeachers.length, "teacher plays", "teachers play")} no instrument, so ${plural(emptyTeachers.length, "they can", "they can")} never be given a class.`,
      list: "teachers",
      entityIds: emptyTeachers.map((t) => t.id),
    });
  }

  const namelessRooms = rooms.filter((r) => blank(r.name));
  if (namelessRooms.length > 0) {
    problems.push({
      id: "room-no-name",
      severity: "warning",
      message: `${namelessRooms.length} ${plural(namelessRooms.length, "room has", "rooms have")} no name, so ${plural(namelessRooms.length, "it", "they")} will be numbered for you on the timetable.`,
      list: "rooms",
      entityIds: namelessRooms.map((r) => r.id),
    });
  }

  const roomsByName = new Map<string, Room[]>();
  for (const room of rooms) {
    if (blank(room.name)) continue;
    const key = room.name.trim().toLowerCase();
    const list = roomsByName.get(key) ?? [];
    list.push(room);
    roomsByName.set(key, list);
  }
  const duplicateRooms = [...roomsByName.values()].filter((list) => list.length > 1);
  if (duplicateRooms.length > 0) {
    problems.push({
      id: "duplicate-rooms",
      severity: "error",
      message: `${duplicateRooms.length} room ${plural(duplicateRooms.length, "name is", "names are")} used twice. Two rooms with the same name are one room as far as the solver is concerned, which would let two classes share it.`,
      list: "rooms",
      entityIds: duplicateRooms.flat().map((r) => r.id),
    });
  }

  const roomIds = new Set(rooms.map((r) => String(r.id).trim().toLowerCase()));
  const roomNameById = new Map(
    rooms.map((r) => [String(r.id).trim().toLowerCase(), r.name || "(unnamed room)"]),
  );

  const wantSameRoom = new Map<string, Teacher[]>();
  const wantMissingRoom: Teacher[] = [];
  for (const teacher of teachers) {
    const wanted = teacher.preferredRoomId?.trim().toLowerCase();
    if (!wanted) continue;
    if (!roomIds.has(wanted)) {
      wantMissingRoom.push(teacher);
      continue;
    }
    const list = wantSameRoom.get(wanted) ?? [];
    list.push(teacher);
    wantSameRoom.set(wanted, list);
  }

  const contested = [...wantSameRoom.entries()].filter(([, list]) => list.length > 1);
  for (const [roomId, list] of contested) {
    problems.push({
      id: `contested-room-${roomId}`,
      severity: "warning",
      message: `${list.length} teachers all want ${roomNameById.get(roomId)} (${list
        .map((t) => t.name || "(no name)")
        .join(", ")}). They cannot all have it, so some will be moved.`,
      list: "teachers",
      entityIds: list.map((t) => t.id),
    });
  }

  if (wantMissingRoom.length > 0) {
    problems.push({
      id: "teacher-room-missing",
      severity: "warning",
      message: `${wantMissingRoom.length} ${plural(wantMissingRoom.length, "teacher wants a room", "teachers want rooms")} that ${plural(wantMissingRoom.length, "is", "are")} no longer in the room list, so the preference cannot be met. Pick the room again.`,
      list: "teachers",
      entityIds: wantMissingRoom.map((t) => t.id),
    });
  }

  /* ----------------------------------------- instruments nobody can teach */

  const taught = new Set<string>();
  for (const teacher of teachers) {
    for (const instrument of teacher.instruments ?? []) taught.add(instrument);
  }

  const studentsByInstrument = new Map<string, Student[]>();
  for (const student of students) {
    if (blank(student.instrument)) continue;
    const list = studentsByInstrument.get(student.instrument) ?? [];
    list.push(student);
    studentsByInstrument.set(student.instrument, list);
  }

  for (const [instrument, playing] of studentsByInstrument) {
    if (taught.has(instrument)) continue;
    problems.push({
      id: `untaught-${instrument}`,
      severity: "error",
      message: `Nobody teaches ${instrumentLabel(instrument)}, but ${playing.length} ${plural(playing.length, "student plays", "students play")} it.`,
      list: "students",
      entityIds: playing.map((s) => s.id),
    });
  }

  /* ------------------------------------------------------------- capacity */

  if (
    evening.slots > 0 &&
    teachers.length > 0 &&
    rooms.length > 0 &&
    students.length > 0
  ) {
    let classesNeeded = 0;
    for (const playing of studentsByInstrument.values()) {
      classesNeeded += Math.ceil(playing.length / Math.max(1, maxClassSize));
    }

    // Two ceilings on how many classes can run at once: a teacher can only be in one place,
    // and so can a room. The tighter one decides, and naming it is what makes the message
    // useful - otherwise she is told to add a teacher when what she needs is a room.
    const limit = Math.min(teachers.length, rooms.length);
    const capacity = evening.slots * limit;
    if (classesNeeded > capacity) {
      const scarcer =
        rooms.length < teachers.length
          ? `${rooms.length} ${plural(rooms.length, "room", "rooms")}`
          : `${teachers.length} ${plural(teachers.length, "teacher", "teachers")}`;
      const remedy =
        rooms.length < teachers.length
          ? "Add a room, lengthen the evening, or shorten the classes."
          : "Add a teacher, lengthen the evening, or shorten the classes.";
      problems.push({
        id: "capacity",
        severity: "error",
        message: `These students need at least ${classesNeeded} classes, but ${scarcer} across ${evening.slots} class ${plural(evening.slots, "time", "times")} can only run ${capacity}. ${remedy}`,
      });
    }
  }

  /* -------------------------------------------------- likely typos */

  const byName = new Map<string, Student[]>();
  for (const student of students) {
    if (blank(student.name)) continue;
    const key = student.name.trim().toLowerCase();
    const list = byName.get(key) ?? [];
    list.push(student);
    byName.set(key, list);
  }
  const duplicated = [...byName.values()].filter((list) => list.length > 1);
  if (duplicated.length > 0) {
    problems.push({
      id: "duplicate-names",
      severity: "warning",
      message: `${duplicated.length} ${plural(duplicated.length, "name appears", "names appear")} more than once in the student list. That may be twins, or it may be a double entry.`,
      list: "students",
      entityIds: duplicated.flat().map((s) => s.id),
    });
  }

  const byFamily = new Map<string, Student[]>();
  for (const student of students) {
    const familyId = student.familyId?.trim().toLowerCase();
    if (!familyId) continue;
    const list = byFamily.get(familyId) ?? [];
    list.push(student);
    byFamily.set(familyId, list);
  }
  const lonely = [...byFamily.entries()].filter(([, list]) => list.length === 1);
  if (lonely.length > 0) {
    problems.push({
      id: "lonely-families",
      severity: "warning",
      message: `${lonely.length} ${plural(lonely.length, "family has", "families have")} only one student in ${plural(lonely.length, "it", "them")} (${lonely.map(([id]) => id).join(", ")}). Check for a typo in the Family column.`,
      list: "students",
      entityIds: lonely.flatMap(([, list]) => list.map((s) => s.id)),
    });
  }

  return problems;
}

export function hasBlockingProblem(problems: Problem[]): boolean {
  return problems.some((problem) => problem.severity === "error");
}