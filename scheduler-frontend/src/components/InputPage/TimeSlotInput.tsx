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

  return (
    <div className="bg-amber-600 rounded-lg p-2">
      <p className="text-left pb-4 text-3xl">Time Slots</p>
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-2">
          <label>Start time of first class:</label>
          <input
            className="bg-amber-700 rounded-lg px-2"
            type="time"
            defaultValue={dayStart}
            onChange={(e) =>
              setTimeSlotParams({ ...timeSlotParams, dayStart: e.target.value })
            }
          ></input>
        </div>
        <div className="flex flex-row gap-2">
          <label>End time of last class:</label>
          <input
            className="bg-amber-700 rounded-lg px-2"
            type="time"
            defaultValue={dayEnd}
            onChange={(e) =>
              setTimeSlotParams({ ...timeSlotParams, dayEnd: e.target.value })
            }
          ></input>
        </div>
        <div className="flex flex-row gap-2">
          <label>Length of class (in mins):</label>
          <input
            className="bg-amber-700 rounded-lg px-2"
            type="number"
            defaultValue={lengthOfLesson}
            onChange={(e) =>
              setTimeSlotParams({
                ...timeSlotParams,
                lengthOfLesson: parseInt(e.target.value),
              })
            }
          ></input>
        </div>
      </div>
    </div>
  );
};
