package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.enums.Instrument;
import com.scheduler.schedulerBackend.enums.SkillLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TimeTableTest {

    private static Student student(String name, Instrument instrument) {
        return new Student(name, instrument, SkillLevel.BEGINNER);
    }

    private static List<Student> students(Instrument instrument, int count) {
        List<Student> list = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            list.add(student(instrument + " student " + i, instrument));
        }
        return list;
    }

    private static List<Teacher> oneTeacher() {
        return List.of(new Teacher("Máire", List.of(Instrument.values())));
    }

    private static TimeTable timeTable(List<Student> students, String start, String end, int length) {
        TimeTable timeTable = new TimeTable();
        timeTable.setStudentList(students);
        timeTable.setTeacherList(oneTeacher());
        timeTable.setDayStart(start == null ? null : LocalTime.parse(start));
        timeTable.setDayEnd(end == null ? null : LocalTime.parse(end));
        timeTable.setLengthOfLesson(length);
        return timeTable;
    }

    // ------------------------------------------------------------ time slots

    @Test
    @DisplayName("18:00-20:00 in 30 minute classes gives four slots")
    void generatesFourSlots() {
        TimeTable timeTable = timeTable(students(Instrument.FIDDLE, 4), "18:00", "20:00", 30);
        timeTable.generateSchedule();

        assertEquals(4, timeTable.getTimeSlotList().size());
        assertEquals(LocalTime.of(18, 0), timeTable.getTimeSlotList().get(0).getStartTime());
        assertEquals(LocalTime.of(20, 0), timeTable.getTimeSlotList().get(3).getEndTime());
        assertEquals(0, timeTable.getUnusedMinutes());
    }

    @Test
    @DisplayName("review 3.2: a class length that doesn't divide the evening reports the wasted minutes")
    void reportsUnusedMinutes() {
        TimeTable timeTable = timeTable(students(Instrument.FIDDLE, 4), "18:00", "20:00", 45);
        timeTable.generateSchedule();

        assertEquals(2, timeTable.getTimeSlotList().size());
        assertEquals(30, timeTable.getUnusedMinutes(),
                "the last half hour is unusable and the UI needs to say so");
    }

    @Test
    @DisplayName("a slot is never generated that runs past the end of the evening")
    void neverOverrunsTheEvening() {
        TimeTable timeTable = timeTable(students(Instrument.FIDDLE, 4), "18:00", "19:50", 30);
        timeTable.generateSchedule();

        LocalTime lastEnd = timeTable.getTimeSlotList()
                .get(timeTable.getTimeSlotList().size() - 1).getEndTime();
        assertTrue(!lastEnd.isAfter(LocalTime.of(19, 50)), "last slot ended at " + lastEnd);
    }

    // ------------------------------------------------------------- validation

    @Test
    @DisplayName("review 3.1: lengthOfLesson 0 is rejected instead of looping forever")
    void rejectsZeroLengthLesson() {
        TimeTable timeTable = timeTable(students(Instrument.FIDDLE, 4), "18:00", "20:00", 0);

        IllegalArgumentException e =
                assertThrows(IllegalArgumentException.class, timeTable::generateSchedule);
        assertTrue(e.getMessage().contains("lengthOfLesson"), e.getMessage());
    }

    @Test
    @DisplayName("review 3.1: other nonsense input is rejected too")
    void rejectsOtherBadInput() {
        assertThrows(IllegalArgumentException.class,
                () -> timeTable(students(Instrument.FIDDLE, 4), "18:00", "20:00", -30).generateSchedule(),
                "negative class length");

        assertThrows(IllegalArgumentException.class,
                () -> timeTable(students(Instrument.FIDDLE, 4), "20:00", "18:00", 30).generateSchedule(),
                "end before start");

        assertThrows(IllegalArgumentException.class,
                () -> timeTable(students(Instrument.FIDDLE, 4), null, "20:00", 30).generateSchedule(),
                "missing dayStart");

        assertThrows(IllegalArgumentException.class,
                () -> timeTable(List.of(), "18:00", "20:00", 30).generateSchedule(),
                "no students");

        assertThrows(IllegalArgumentException.class,
                () -> timeTable(students(Instrument.FIDDLE, 4), "18:00", "18:20", 30).generateSchedule(),
                "evening too short for one class");
    }

    // ------------------------------------------------------------ class sizes

    @Test
    @DisplayName("one class per six students of an instrument")
    void formsOneClassPerSixStudents() {
        assertEquals(1, lessonCountFor(1));
        assertEquals(1, lessonCountFor(6));
        assertEquals(2, lessonCountFor(7));
        assertEquals(2, lessonCountFor(12));
        assertEquals(3, lessonCountFor(13));
    }

    @Test
    @DisplayName("review 3.3: a single student of an instrument still produces a solvable problem")
    void loneStudentDoesNotBreakTheSchedule() {
        TimeTable timeTable = timeTable(students(Instrument.BODHRAN, 1), "18:00", "20:00", 30);
        assertDoesNotThrow(timeTable::generateSchedule);
        assertEquals(1, timeTable.getLessonList().size());
        assertEquals(1, timeTable.getStudentAssignmentList().size());
    }

    @Test
    @DisplayName("every student gets exactly one assignment")
    void everyStudentGetsAnAssignment() {
        List<Student> all = new ArrayList<>(students(Instrument.GUITAR, 7));
        all.addAll(students(Instrument.FIDDLE, 3));

        TimeTable timeTable = timeTable(all, "18:00", "20:00", 30);
        timeTable.generateSchedule();

        assertEquals(10, timeTable.getStudentAssignmentList().size());
        assertEquals(3, timeTable.getLessonList().size()); // 2 guitar + 1 fiddle
    }

    @Test
    @DisplayName("the five-argument constructor builds the whole problem, assignments included")
    void constructorBuildsStudentAssignments() {
        TimeTable timeTable = new TimeTable(oneTeacher(), students(Instrument.FLUTE, 4),
                LocalTime.of(18, 0), LocalTime.of(20, 0), 30);

        assertEquals(4, timeTable.getTimeSlotList().size());
        assertEquals(1, timeTable.getLessonList().size());
        assertEquals(4, timeTable.getStudentAssignmentList().size());
    }

    private int lessonCountFor(int studentCount) {
        TimeTable timeTable = timeTable(students(Instrument.GUITAR, studentCount), "18:00", "20:00", 30);
        timeTable.generateSchedule();
        return timeTable.getLessonList().size();
    }
}