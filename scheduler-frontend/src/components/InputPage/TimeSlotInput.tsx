import { describeEvening } from "../../evening";
import type { TimeSlotParams } from "./types";

interface TimeSlotInputProps {
  timeSlotParams: TimeSlotParams;
  setTimeSlotParams: (value: TimeSlotParams) => void;
}

export const TimeSlotInput = ({
  timeSlotParams,
  setTimeSlotParams,
}: TimeSlotInputProps) => {
  const { dayStart, dayEnd, lengthOfLesson } = timeSlotParams;
  const evening = describeEvening(timeSlotParams);

  let preview: string;
  let previewIsWarning = false;

  if (evening.problem) {
    preview = evening.problem;
    previewIsWarning = true;
  } else {
    preview = `${evening.slots} class time${evening.slots === 1 ? "" : "s"} of ${lengthOfLesson} min`;
    if (evening.unusedMinutes > 0) {
      preview += ` — ${evening.unusedMinutes} min at the end of the evening will go unused`;
      previewIsWarning = true;
    }
  }

  return (
    <div className="bg-amber-600 rounded-lg p-4">
      <h2 className="text-left pb-4 text-2xl font-semibold">
        <span className="opacity-70">1.</span> The evening
      </h2>
      <div className="flex flex-row flex-wrap justify-between gap-4">
        <div className="flex flex-row items-center gap-2">
          <label htmlFor="dayStart">Start time of first class:</label>
          <input
            id="dayStart"
            className="bg-amber-700 rounded-lg px-2 py-1"
            type="time"
            value={dayStart}
            onChange={(e) =>
              setTimeSlotParams({ ...timeSlotParams, dayStart: e.target.value })
            }
          />
        </div>
        <div className="flex flex-row items-center gap-2">
          <label htmlFor="dayEnd">End time of last class:</label>
          <input
            id="dayEnd"
            className="bg-amber-700 rounded-lg px-2 py-1"
            type="time"
            value={dayEnd}
            onChange={(e) =>
              setTimeSlotParams({ ...timeSlotParams, dayEnd: e.target.value })
            }
          />
        </div>
        <div className="flex flex-row items-center gap-2">
          <label htmlFor="lengthOfLesson">Length of class (in mins):</label>
          <input
            id="lengthOfLesson"
            className="bg-amber-700 rounded-lg px-2 py-1 w-24"
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