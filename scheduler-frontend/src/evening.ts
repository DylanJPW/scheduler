import type { TimeSlot } from "./types";
import type { TimeSlotParams } from "./components/InputPage/types";

function toHhMm(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function toMinutes(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 23 || mins > 59) return null;
  return hours * 60 + mins;
}

export interface EveningShape {
  slots: number;
  unusedMinutes: number;
  problem: string | null;
}

export function describeEvening({
  dayStart,
  dayEnd,
  lengthOfLesson,
}: TimeSlotParams): EveningShape {
  const startMins = toMinutes(dayStart);
  const endMins = toMinutes(dayEnd);

  if (startMins === null || endMins === null) {
    return { slots: 0, unusedMinutes: 0, problem: "Enter a start and end time." };
  }

  const totalMins = endMins - startMins;
  if (totalMins <= 0) {
    return {
      slots: 0,
      unusedMinutes: 0,
      problem: "The end time must be after the start time.",
    };
  }
  if (!Number.isFinite(lengthOfLesson) || lengthOfLesson < 5) {
    return {
      slots: 0,
      unusedMinutes: 0,
      problem: "Enter a class length of at least 5 minutes.",
    };
  }

  const slots = Math.floor(totalMins / lengthOfLesson);
  if (slots === 0) {
    return {
      slots: 0,
      unusedMinutes: totalMins,
      problem: `That evening is only ${totalMins} minutes — too short for one ${lengthOfLesson} minute class.`,
    };
  }

  return {
    slots,
    unusedMinutes: totalMins % lengthOfLesson,
    problem: null,
  };
}

export function buildTimeSlots(params: TimeSlotParams): TimeSlot[] {
  const { slots, problem } = describeEvening(params);
  if (problem || slots === 0) return [];

  const start = toMinutes(params.dayStart);
  if (start === null) return [];

  return Array.from({ length: slots }, (_, index) => {
    const slotStart = start + index * params.lengthOfLesson;
    return {
      startTime: toHhMm(slotStart),
      endTime: toHhMm(slotStart + params.lengthOfLesson),
    };
  });
}