import { describeEvening } from "./evening";
import { instrumentLabel, type EntityId, type Student, type Teacher } from "./types";
import type { TimeSlotParams } from "./components/InputPage/types";

export type ProblemSeverity = "error" | "warning";
export type ProblemList = "students" | "teachers";

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

  if (evening.slots > 0 && teachers.length > 0 && students.length > 0) {
    let classesNeeded = 0;
    for (const playing of studentsByInstrument.values()) {
      classesNeeded += Math.ceil(playing.length / Math.max(1, maxClassSize));
    }
    const capacity = evening.slots * teachers.length;
    if (classesNeeded > capacity) {
      problems.push({
        id: "capacity",
        severity: "error",
        message: `These students need at least ${classesNeeded} classes, but ${teachers.length} ${plural(teachers.length, "teacher", "teachers")} across ${evening.slots} class ${plural(evening.slots, "time", "times")} can only run ${capacity}. Add a teacher, lengthen the evening, or shorten the classes.`,
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