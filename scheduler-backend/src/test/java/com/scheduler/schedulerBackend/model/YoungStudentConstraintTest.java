package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.config.SchedulingRules;
import com.scheduler.schedulerBackend.enums.Instrument;
import com.scheduler.schedulerBackend.enums.SkillLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.optaplanner.test.api.score.stream.ConstraintVerifier;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class YoungStudentConstraintTest {

    private static final int SLOT_MINUTES = 30;
    private static final List<TimeSlot> EVENING = evening("18:00", 4);

    private final ConstraintVerifier<TimeTableConstraintProvider, TimeTable> constraintVerifier =
            ConstraintVerifier.build(new TimeTableConstraintProvider(), TimeTable.class,
                    Lesson.class, StudentAssignment.class);

    private final Teacher teacher = new Teacher("Teacher", List.of(Instrument.FIDDLE));
    private final Room room = new Room("room-1", "Room 1");

    private long nextLessonId = 0;
    private long nextAssignmentId = 0;

    private static List<TimeSlot> evening(String firstStart, int slotCount) {
        List<TimeSlot> slots = new ArrayList<>(slotCount);
        LocalTime start = LocalTime.parse(firstStart);
        for (int i = 0; i < slotCount; i++) {
            slots.add(new TimeSlot(start, start.plusMinutes(SLOT_MINUTES)));
            start = start.plusMinutes(SLOT_MINUTES);
        }
        return slots;
    }

    private Lesson lessonInSlot(int slotIndex) {
        Lesson lesson = new Lesson(nextLessonId++, Instrument.FIDDLE);
        lesson.setTimeSlot(EVENING.get(slotIndex));
        lesson.setTeacher(teacher);
        lesson.setRoom(room);
        return lesson;
    }

    private StudentAssignment aged(Integer age, Lesson lesson) {
        Student student = new Student("Student " + nextAssignmentId, Instrument.FIDDLE, SkillLevel.BEGINNER);
        student.setAgeInYears(age);
        StudentAssignment assignment = new StudentAssignment(nextAssignmentId++, student);
        assignment.setLesson(lesson);
        return assignment;
    }

    private Object[] withEvening(Object... entities) {
        List<Object> facts = new ArrayList<>(EVENING);
        facts.addAll(List.of(entities));
        return facts.toArray();
    }

    // ------------------------------------------------------------- the rule

    @Test
    @DisplayName("a young child in the first slot costs nothing")
    void theFirstSlotIsFreeAtAnyAge() {
        Lesson first = lessonInSlot(0);
        constraintVerifier.verifyThat(TimeTableConstraintProvider::youngStudentsScheduledLate)
                .given(withEvening(first, aged(6, first)))
                .penalizesBy(0);
    }

    @Test
    @DisplayName("the charge is years under the pivot, multiplied by slots late")
    void theChargeIsYouthTimesLateness() {
        Lesson third = lessonInSlot(2);
        constraintVerifier.verifyThat(TimeTableConstraintProvider::youngStudentsScheduledLate)
                .given(withEvening(third, aged(6, third)))
                .penalizesBy(24);   // (18 - 6) years under x 2 slots late
    }

    @Test
    @DisplayName("an older child in the same late class costs less than a younger one")
    void olderChildrenAreCheaperToScheduleLate() {
        Lesson last = lessonInSlot(3);

        constraintVerifier.verifyThat(TimeTableConstraintProvider::youngStudentsScheduledLate)
                .given(withEvening(last, aged(8, last)))
                .penalizesBy(30);   // 10 x 3

        constraintVerifier.verifyThat(TimeTableConstraintProvider::youngStudentsScheduledLate)
                .given(withEvening(last, aged(15, last)))
                .penalizesBy(9);    // 3 x 3
    }

    @Test
    @DisplayName("swapping a young child and a teenager into the right order is cheaper")
    void youngestFirstIsTheCheaperArrangement() {
        Lesson early = lessonInSlot(0);
        Lesson late = lessonInSlot(3);

        constraintVerifier.verifyThat(TimeTableConstraintProvider::youngStudentsScheduledLate)
                .given(withEvening(early, late, aged(16, early), aged(7, late)))
                .penalizesBy(33);   // 0 + (11 x 3)

        constraintVerifier.verifyThat(TimeTableConstraintProvider::youngStudentsScheduledLate)
                .given(withEvening(early, late, aged(7, early), aged(16, late)))
                .penalizesBy(6);    // 0 + (2 x 3)
    }

    @Test
    @DisplayName("a student at the pivot age or older is never pulled earlier by this rule")
    void adultsAreNeverPulledEarlier() {
        Lesson last = lessonInSlot(3);
        constraintVerifier.verifyThat(TimeTableConstraintProvider::youngStudentsScheduledLate)
                .given(withEvening(last, aged(18, last), aged(47, last)))
                .penalizesBy(0);
    }

    @Test
    @DisplayName("a student with no date of birth on file is ignored, not treated as a baby")
    void unknownAgeIsIgnored() {
        Lesson last = lessonInSlot(3);
        assertEquals(0, TimeTableConstraintProvider.yearsUnderPivot(
                new Student("Nobody", Instrument.FIDDLE, SkillLevel.BEGINNER)));

        constraintVerifier.verifyThat(TimeTableConstraintProvider::youngStudentsScheduledLate)
                .given(withEvening(last, aged(null, last)))
                .penalizesBy(0);
    }

    @Test
    @DisplayName("the charge is per student, so a full class of children costs more than one child")
    void theChargeIsPerStudent() {
        Lesson last = lessonInSlot(3);
        constraintVerifier.verifyThat(TimeTableConstraintProvider::youngStudentsScheduledLate)
                .given(withEvening(last, aged(10, last), aged(10, last), aged(10, last)))
                .penalizesBy(72);   // 3 students x 8 years under x 3 slots
    }

    // ----------------------------------------------------------- the ladder

    @Test
    @DisplayName("getting the youngest home first outranks tidying the evening forward, and little else")
    void whereThisSitsOnTheLadder() {
        assertTrue(SchedulingRules.LATE_SLOT_PENALTY < SchedulingRules.YOUNG_STUDENT_LATE_PENALTY,
                "a child's bedtime should count for more than merely packing the evening forward");
        assertTrue(SchedulingRules.YOUNG_STUDENT_LATE_PENALTY < SchedulingRules.PREFERRED_TIME_PENALTY,
                "per unit of violation, a stated time preference still outranks this");
    }
}