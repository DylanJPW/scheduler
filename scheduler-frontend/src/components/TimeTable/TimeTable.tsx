import type { Lesson, TimeSlot } from "../../types";
import { getTheme } from "../../utils";
import type { TimeTableProps } from "./types";
import "./TimeTable.css";

interface TimeSlotRowProps {
  timeSlot: TimeSlot;
  lessons: Lesson[];
}

const LessonCell = ({ teacher, instrument, students }: Lesson) => {
  const { base, light } = getTheme(instrument);
  return (
    <td>
      <div className={`border rounded-lg m-2 ${light}`}>
        <div className={`cell-header rounded-t-lg ${base}`}>{instrument}</div>
        <div>
          <p>Teacher: {teacher?.name}</p>
          <p>Students: {students?.length}</p>
        </div>
      </div>
    </td>
  );
};

const TimeSlotRow = ({ timeSlot, lessons }: TimeSlotRowProps) => {
  const { startTime, endTime } = timeSlot;
  return (
    <tr>
      <td>
        {startTime} - {endTime}
      </td>
      {lessons.map((lesson) => (
        <LessonCell {...lesson} />
      ))}
    </tr>
  );
};

export const TimeTable = ({ timeSlotList, lessonList }: TimeTableProps) => {
  let maxLessons = 0;
  const lessonsByStartTime = lessonList.reduce(
    (acc, lesson) => {
      const key = lesson.timeSlot.startTime;

      if (!acc[key]) acc[key] = [];

      acc[key].push(lesson);

      maxLessons = Math.max(maxLessons, acc[key].length);

      return acc;
    },
    {} as Record<string, Lesson[]>,
  );

  return (
    <div className="w-full border border-table-line rounded-lg">
      <table className="w-full">
        <colgroup>
          <col span={1} className="border-r" />
        </colgroup>
        <thead className="border-b">
          <tr>
            <th>Time</th>
            <th colSpan={maxLessons} align="center">
              Classes
            </th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {timeSlotList.map((timeSlot) => (
            <TimeSlotRow
              key={timeSlot.startTime}
              timeSlot={timeSlot}
              lessons={lessonsByStartTime[timeSlot.startTime] ?? []}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
