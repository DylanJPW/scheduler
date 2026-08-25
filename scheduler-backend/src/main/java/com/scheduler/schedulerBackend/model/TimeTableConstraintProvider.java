package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.config.SchedulingRules;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.optaplanner.core.api.score.stream.*;

import java.time.Duration;
import java.time.LocalTime;

public class TimeTableConstraintProvider implements ConstraintProvider {

    private static final int SMALL_CLASS_PENALTY = 100;

    @Override
    public Constraint[] defineConstraints(ConstraintFactory constraintFactory) {
        return new Constraint[] {
                // Hard constraints - these must never be broken
                teacherConflict(constraintFactory),
                teacherLacksInstrument(constraintFactory),
                maxStudentsPerLesson(constraintFactory),
                studentHasWrongInstrument(constraintFactory),

                // Soft constraints - these should be avoided, but a schedule that breaks
                // them is still a usable schedule
                classTooSmall(constraintFactory),
                emptyClass(constraintFactory),
                studentDoesNotPreferTime(constraintFactory),
                teacherDoesNotPreferTime(constraintFactory),
        };
    }

    // ---------------------------------------------------------------- hard

    Constraint teacherConflict(ConstraintFactory constraintFactory) {
        // A teacher can only teach one lesson at a time
        return constraintFactory.forEach(Lesson.class)
                .join(Lesson.class,
                        Joiners.equal(Lesson::getTimeSlot),
                        Joiners.equal(Lesson::getTeacher),
                        Joiners.lessThan(Lesson::getId))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Teacher Conflict");
    }

    Constraint teacherLacksInstrument(ConstraintFactory constraintFactory) {
        // A teacher can only teach what they can play
        return constraintFactory.forEach(Lesson.class)
                .filter(lesson -> lesson.getTeacher().getInstruments() == null
                        || !lesson.getTeacher().getInstruments().contains(lesson.getInstrument()))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Teacher Lacks Instrument");
    }

    Constraint maxStudentsPerLesson(ConstraintFactory factory) {
        return factory.forEach(StudentAssignment.class)
                .groupBy(StudentAssignment::getLesson, ConstraintCollectors.count())
                .filter((lesson, count) -> count > SchedulingRules.MAX_STUDENTS_PER_CLASS)
                .penalize(HardSoftScore.ONE_HARD,
                        (lesson, count) -> count - SchedulingRules.MAX_STUDENTS_PER_CLASS)
                .asConstraint("Max Students Per Lesson");
    }

    Constraint studentHasWrongInstrument(ConstraintFactory factory) {
        return factory.forEach(StudentAssignment.class)
                .filter(sa -> sa.getStudent().getInstrument() != sa.getLesson().getInstrument())
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Student Has Wrong Instrument");
    }

    // ---------------------------------------------------------------- soft

    Constraint classTooSmall(ConstraintFactory factory) {
        return factory.forEach(StudentAssignment.class)
                .groupBy(StudentAssignment::getLesson, ConstraintCollectors.count())
                .filter((lesson, count) -> count < SchedulingRules.MIN_STUDENTS_PER_CLASS)
                .penalize(HardSoftScore.ofSoft(SMALL_CLASS_PENALTY),
                        (lesson, count) -> SchedulingRules.MIN_STUDENTS_PER_CLASS - count)
                .asConstraint("Class Too Small");
    }

    Constraint emptyClass(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .ifNotExists(StudentAssignment.class,
                        Joiners.equal(lesson -> lesson, StudentAssignment::getLesson))
                .penalize(HardSoftScore.ofSoft(
                        SMALL_CLASS_PENALTY * SchedulingRules.MIN_STUDENTS_PER_CLASS))
                .asConstraint("Empty Class");
    }

    Constraint studentDoesNotPreferTime(ConstraintFactory factory) {
        return factory.forEach(StudentAssignment.class)
                .filter(sa -> isOutsidePreference(
                        lessonStartOf(sa), sa.getStudent().getPreferredTimeRange()))
                .penalize(HardSoftScore.ONE_SOFT,
                        sa -> slotsOutsidePreference(
                                lessonStartOf(sa),
                                sa.getStudent().getPreferredTimeRange(),
                                sa.getLesson().getDuration()))
                .asConstraint("Student Does Not Prefer Time");
    }

    Constraint teacherDoesNotPreferTime(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> isOutsidePreference(
                        lessonStartOf(lesson), lesson.getTeacher().getPreferredTimeRange()))
                .penalize(HardSoftScore.ONE_SOFT,
                        lesson -> slotsOutsidePreference(
                                lessonStartOf(lesson),
                                lesson.getTeacher().getPreferredTimeRange(),
                                lesson.getDuration()))
                .asConstraint("Teacher Does Not Prefer Time");
    }

    // ------------------------------------------------------- shared helpers

    private static LocalTime lessonStartOf(StudentAssignment sa) {
        Lesson lesson = sa.getLesson();
        return (lesson == null || lesson.getTimeSlot() == null)
                ? null
                : lesson.getTimeSlot().getStartTime();
    }

    private static LocalTime lessonStartOf(Lesson lesson) {
        return lesson.getTimeSlot() == null ? null : lesson.getTimeSlot().getStartTime();
    }

    private static boolean isOutsidePreference(LocalTime lessonStart, TimeSlot preference) {
        if (lessonStart == null || preference == null
                || preference.getStartTime() == null || preference.getEndTime() == null) {
            return false; // no preference expressed, or nothing scheduled yet: nothing to penalise
        }
        return lessonStart.isBefore(preference.getStartTime())
                || lessonStart.isAfter(preference.getEndTime());
    }

    private static int slotsOutsidePreference(LocalTime lessonStart, TimeSlot preference,
                                              long lessonLengthMinutes) {
        long safeLength = Math.max(1, lessonLengthMinutes);
        long minutesOut = lessonStart.isBefore(preference.getStartTime())
                ? Duration.between(lessonStart, preference.getStartTime()).toMinutes()
                : Duration.between(preference.getEndTime(), lessonStart).toMinutes();
        return (int) Math.max(1, minutesOut / safeLength);
    }
}