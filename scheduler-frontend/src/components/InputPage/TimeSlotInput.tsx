import type { TimeSlotParams } from "./types";

interface TimeSlotInputProps {
  timeSlotParams: TimeSlotParams;
  setTimeSlotParams: (value: TimeSlotParams) => void;
}

function toMinutes(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 23 || mins > 59) return null;
  return hours * 60 + mins;
}

export const TimeSlotInput = ({
  timeSlotParams,
  setTimeSlotParams,
}: TimeSlotInputProps) => {
  const { dayStart, dayEnd, lengthOfLesson } = timeSlotParams;

  const startMins = toMinutes(dayStart);
  const endMins = toMinutes(dayEnd);
  const totalMins =
    startMins !== null && endMins !== null ? endMins - startMins : null;

  let preview: string;
  let previewIsWarning = false;
  if (totalMins === null) {
    preview = "Enter a start and end time.";
    previewIsWarning = true;
  } else if (totalMins <= 0) {
    preview = "The end time must be after the start time.";
    previewIsWarning = true;
  } else if (!Number.isFinite(lengthOfLesson) || lengthOfLesson < 5) {
    preview = "Enter a class length of at least 5 minutes.";
    previewIsWarning = true;
  } else {
    const slots = Math.floor(totalMins / lengthOfLesson);
    const unused = totalMins % lengthOfLesson;
    if (slots === 0) {
      preview = `That evening is only ${totalMins} minutes - too short for one ${lengthOfLesson} minute class.`;
      previewIsWarning = true;
    } else {
      preview = `${slots} class time${slots === 1 ? "" : "s"} of ${lengthOfLesson} min`;
      if (unused > 0) {
        preview += ` — ${unused} min at the end of the evening will go unused`;
        previewIsWarning = true;
      }
    }
  }

  return (
    <div className="bg-amber-600 rounded-lg p-2">
      <p className="text-left pb-4 text-3xl">Time Slots</p>
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-2">
          <label htmlFor="dayStart">Start time of first class:</label>
          <input
            id="dayStart"
            className="bg-amber-700 rounded-lg px-2"
            type="time"
            value={dayStart}
            onChange={(e) =>
              setTimeSlotParams({ ...timeSlotParams, dayStart: e.target.value })
            }
          />
        </div>
        <div className="flex flex-row gap-2">
          <label htmlFor="dayEnd">End time of last class:</label>
          <input
            id="dayEnd"
            className="bg-amber-700 rounded-lg px-2"
            type="time"
            value={dayEnd}
            onChange={(e) =>
              setTimeSlotParams({ ...timeSlotParams, dayEnd: e.target.value })
            }
          />
        </div>
        <div className="flex flex-row gap-2">
          <label htmlFor="lengthOfLesson">Length of class (in mins):</label>
          <input
            id="lengthOfLesson"
            className="bg-amber-700 rounded-lg px-2"
            type="number"
            min={5}
            max={240}
            step={5}
            value={Number.isFinite(lengthOfLesson) ? lengthOfLesson : ""}
            onChange={(e) => {
              const parsed = Number.parseInt(e.target.value, 10);
              setTimeSlotParams({
                ...timeSlotParams,
                lengthOfLesson: Number.isNaN(parsed) ? 0 : parsed,
              });
            }}
          />
        </div>
      </div>
      <p
        className={`text-left pt-3 text-sm ${
          previewIsWarning ? "text-red-100 font-semibold" : "text-amber-100"
        }`}
        role={previewIsWarning ? "alert" : undefined}
      >
        {preview}
      </p>
    </div>
  );
};