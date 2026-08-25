package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.enums.Instrument;
import com.scheduler.schedulerBackend.enums.SkillLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.optaplanner.test.api.score.stream.ConstraintVerifier;

import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SiblingConstraintTest {

    private static final int SLOT_MINUTES = 30;

    private final ConstraintVerifier<TimeTableConstraintProvider, TimeTable> constraintVerifier =
            ConstraintVerifier.build(new TimeTableConstraintProvider(), TimeTable.class,
                    Lesson.class, StudentAssignment.class);

    private long nextId = 0;

    private Lesson lessonAt(String start) {
        LocalTime startTime = LocalTime.parse(start);
        Lesson lesson = new Lesson(nextId++, Instrument.FIDDLE);
        lesson.setTimeSlot(new TimeSlot(startTime, startTime.plusMinutes(SLOT_MINUTES)));
        return lesson;
    }

    private StudentAssignment assignment(String name, String familyId, Lesson lesson) {
        Student student = new Student(name, Instrument.FIDDLE, SkillLevel.BEGINNER, familyId);
        StudentAssignment assignment = new StudentAssignment(nextId++, student);
        assignment.setLesson(lesson);
        return assignment;
    }

    // ------------------------------------------------------------- the happy cases

    @Test
    @DisplayName("siblings in the same time slot cost nothing")
    void siblingsAtTheSameTimeAreFree() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::siblingsScheduledApart)
                .given(assignment("Aoife", "murphy", lessonAt("18:00")),
                        assignment("Cian", "murphy", lessonAt("18:00")))
                .penalizesBy(0);
    }

    @Test
    @DisplayName("siblings in the very same class cost nothing")
    void siblingsInTheSameClassAreFree() {
        Lesson sharedLesson = lessonAt("18:00");
        constraintVerifier.verifyThat(TimeTableConstraintProvider::siblingsScheduledApart)
                .given(assignment("Aoife", "murphy", sharedLesson),
                        assignment("Cian", "murphy", sharedLesson))
                .penalizesBy(0);
    }

    // ---------------------------------------------------------------- the penalties

    @Test
    @DisplayName("siblings one slot apart are penalised once")
    void oneSlotApart() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::siblingsScheduledApart)
                .given(assignment("Aoife", "murphy", lessonAt("18:00")),
                        assignment("Cian", "murphy", lessonAt("18:30")))
                .penalizesBy(1);
    }

    @Test
    @DisplayName("the penalty grows with the size of the gap")
    void penaltyGrowsWithTheGap() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::siblingsScheduledApart)
                .given(assignment("Aoife", "murphy", lessonAt("18:00")),
                        assignment("Cian", "murphy", lessonAt("19:30")))
                .penalizesBy(3);
    }

    @Test
    @DisplayName("three siblings are charged once per pair, not once per ordering")
    void threeSiblingsCountEachPairOnce() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::siblingsScheduledApart)
                .given(assignment("Aoife", "murphy", lessonAt("18:00")),
                        assignment("Cian", "murphy", lessonAt("18:30")),
                        assignment("Saoirse", "murphy", lessonAt("19:00")))
                .penalizesBy(4);
    }

    // ------------------------------------------------------- who is *not* a sibling

    @Test
    @DisplayName("students with no family id are never treated as siblings")
    void studentsWithoutAFamilyAreIgnored() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::siblingsScheduledApart)
                .given(assignment("Aoife", null, lessonAt("18:00")),
                        assignment("Cian", null, lessonAt("19:30")))
                .penalizesBy(0);
    }

    @Test
    @DisplayName("a blank family id does not group strangers together")
    void blankFamilyIdIsIgnored() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::siblingsScheduledApart)
                .given(assignment("Aoife", "", lessonAt("18:00")),
                        assignment("Cian", "   ", lessonAt("19:30")))
                .penalizesBy(0);
    }

    @Test
    @DisplayName("two different families are not siblings")
    void differentFamiliesAreIgnored() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::siblingsScheduledApart)
                .given(assignment("Aoife", "murphy", lessonAt("18:00")),
                        assignment("Cian", "byrne", lessonAt("19:30")))
                .penalizesBy(0);
    }

    @Test
    @DisplayName("family ids that differ only by case or spacing still match")
    void familyIdMatchingIsForgiving() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::siblingsScheduledApart)
                .given(assignment("Aoife", "Murphy", lessonAt("18:00")),
                        assignment("Cian", " murphy ", lessonAt("18:30")))
                .penalizesBy(1);
    }

    @Test
    @DisplayName("one sibling pair does not leak into another family's score")
    void familiesAreScoredSeparately() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::siblingsScheduledApart)
                .given(assignment("Aoife", "murphy", lessonAt("18:00")),
                        assignment("Cian", "murphy", lessonAt("18:30")),
                        assignment("Niamh", "byrne", lessonAt("18:00")),
                        assignment("Oisín", "byrne", lessonAt("19:00")))
                .penalizesBy(3); // 1 for the Murphys + 2 for the Byrnes
    }

    // --------------------------------------------- the arithmetic, on its own

    @Test
    @DisplayName("slotsApart is symmetric and measured in whole slots")
    void slotsApartArithmetic() {
        StudentAssignment early = assignment("Aoife", "murphy", lessonAt("18:00"));
        StudentAssignment late = assignment("Cian", "murphy", lessonAt("19:30"));

        assertEquals(3, TimeTableConstraintProvider.slotsApart(early, late));
        assertEquals(3, TimeTableConstraintProvider.slotsApart(late, early),
                "the gap between two siblings cannot depend on which one you look at first");
    }

    @Test
    @DisplayName("a class that has not been placed yet is not penalised")
    void unplacedLessonIsNotPenalised() {
        Lesson unplaced = new Lesson(nextId++, Instrument.FIDDLE); // no time slot yet
        StudentAssignment placed = assignment("Aoife", "murphy", lessonAt("18:00"));
        StudentAssignment notPlaced = assignment("Cian", "murphy", unplaced);

        assertEquals(0, TimeTableConstraintProvider.slotsApart(placed, notPlaced));
    }
}