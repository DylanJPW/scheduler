package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.enums.Instrument;
import com.scheduler.schedulerBackend.enums.SkillLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.optaplanner.core.api.score.constraint.ConstraintMatch;
import org.optaplanner.core.api.score.stream.Constraint;
import org.optaplanner.core.api.score.stream.ConstraintJustification;

import java.lang.reflect.Method;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BrokenRuleDTOTest {

    private static final String PACKAGE = "com.scheduler.schedulerBackend.model";

    @Test
    @DisplayName("every constraint in the provider has a sentence to go with it")
    void noConstraintIsLeftWithoutWords() {
        long constraintMethods = Arrays.stream(TimeTableConstraintProvider.class.getDeclaredMethods())
                .filter(method -> method.getReturnType() == Constraint.class)
                .map(Method::getName)
                .distinct()
                .count();

        assertEquals(constraintMethods, BrokenRuleDTO.ruleCount(),
                "add an entry to BrokenRuleDTO.RULES for the constraint you just wrote, "
                        + "or the schedule page will show its raw name to a non-programmer");
    }

    @Test
    @DisplayName("a name nobody wrote a sentence for still produces something readable")
    void unknownConstraintsFallBack() {
        assertFalse(BrokenRuleDTO.hasDescription("Some Future Rule"));
        assertEquals("Some Future Rule (3)", BrokenRuleDTO.describe("Some Future Rule", 3));
    }

    @Test
    @DisplayName("sentences read correctly for one and for many")
    void singularAndPlural() {
        assertEquals("1 class is not in the teacher's usual room",
                BrokenRuleDTO.describe("Teacher Outside Preferred Room", 1));
        assertEquals("4 classes are not in the teacher's usual room",
                BrokenRuleDTO.describe("Teacher Outside Preferred Room", 4));
        assertEquals("1 pair of siblings are not close together in the evening",
                BrokenRuleDTO.describe("Siblings Scheduled Apart", 1));
    }

    @Test
    @DisplayName("the two rules whose match count is not a count of things say so")
    void countsThatAreNotCountsOfThings() {
        // Both of these make one match per (thing, earlier slot), so their count is an amount of
        // lateness, not a number of students or classes. Saying "87 students" would be a lie.
        String young = BrokenRuleDTO.describe("Young Students Scheduled Late", 87);
        assertTrue(young.contains("87 student-slots"), young);
        assertFalse(young.contains("87 students"), young);

        String early = BrokenRuleDTO.describe("Prefer Earlier Time Slots", 22);
        assertTrue(early.contains("22 slot-steps"), early);
        assertFalse(early.contains("22 classes"), early);
    }

    // --------------------------------------------------------- lesson ids

    private static Lesson lesson(long id) {
        Lesson lesson = new Lesson(id, Instrument.FIDDLE);
        lesson.setTimeSlot(new TimeSlot(LocalTime.of(18, 0), LocalTime.of(18, 30)));
        return lesson;
    }

    /** The justification is what the rule would tell a human; the indicted objects are what it points at. */
    private record AnyJustification() implements ConstraintJustification {}

    private static ConstraintMatch<HardSoftScore> match(Object... indicted) {
        return new ConstraintMatch<>(PACKAGE, "Any Rule", new AnyJustification(),
                List.of(indicted), HardSoftScore.ONE_SOFT);
    }

    @Test
    @DisplayName("a rule only names the people it is actually about")
    void onlyTheGuiltyAreNamed() {
        // Every match indicts whatever its stream selected, so the rule that packs the evening
        // forward mentions a teacher purely because it joined the class to find the time. Nine
        // blameless teachers lighting up under "the evening could be tighter" is not a highlight,
        // it is noise.
        assertEquals(BrokenRuleDTO.Blames.NOBODY, BrokenRuleDTO.blamesFor("Prefer Earlier Time Slots"));
        assertEquals(BrokenRuleDTO.Blames.NOBODY, BrokenRuleDTO.blamesFor("Room Conflict"));
        assertEquals(BrokenRuleDTO.Blames.NOBODY, BrokenRuleDTO.blamesFor("Empty Class"));

        assertEquals(BrokenRuleDTO.Blames.STUDENTS, BrokenRuleDTO.blamesFor("Young Students Scheduled Late"));
        assertEquals(BrokenRuleDTO.Blames.STUDENTS, BrokenRuleDTO.blamesFor("Siblings Scheduled Apart"));
        assertEquals(BrokenRuleDTO.Blames.TEACHER, BrokenRuleDTO.blamesFor("Teacher Outside Preferred Room"));
    }

    @Test
    @DisplayName("a constraint nobody wrote an entry for blames nobody rather than guessing")
    void unknownConstraintsBlameNobody() {
        assertEquals(BrokenRuleDTO.Blames.NOBODY, BrokenRuleDTO.blamesFor("Some Future Rule"));
    }

    @Test
    @DisplayName("a class is picked up whether the rule indicts it directly or via a student")
    void lessonIdsAreFoundThroughEitherRoute() {
        Lesson direct = lesson(7);
        Lesson viaStudent = lesson(9);

        StudentAssignment assignment = new StudentAssignment(
                1L, new Student("Aoife", Instrument.FIDDLE, SkillLevel.BEGINNER));
        assignment.setLesson(viaStudent);

        List<Long> ids = BrokenRuleDTO.lessonIdsOf(Set.of(match(direct), match(assignment)));

        assertEquals(2, ids.size(), ids.toString());
        assertTrue(ids.containsAll(List.of(7L, 9L)), ids.toString());
    }

    @Test
    @DisplayName("the same class named by several matches is only listed once")
    void lessonIdsAreDeduplicated() {
        Lesson repeated = lesson(3);
        assertEquals(List.of(3L), BrokenRuleDTO.lessonIdsOf(
                Set.of(match(repeated, new TimeSlot(LocalTime.of(18, 0), LocalTime.of(18, 30))))));
    }

    @Test
    @DisplayName("a student not yet in a class does not blow up the breakdown")
    void unassignedStudentsAreSkipped() {
        StudentAssignment unplaced = new StudentAssignment(
                2L, new Student("Nobody", Instrument.FIDDLE, SkillLevel.BEGINNER));
        assertEquals(List.of(), BrokenRuleDTO.lessonIdsOf(Set.of(match(unplaced))));
    }
}
