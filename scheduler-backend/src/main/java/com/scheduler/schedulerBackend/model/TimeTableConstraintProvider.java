package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.config.SchedulingRules;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.optaplanner.core.api.score.stream.*;

import java.time.Duration;
import java.time.LocalTime;

public class TimeTableConstraintProvider implements ConstraintProvider {

    @Override
    public Constraint[] defineConstraints(ConstraintFactory constraintFactory) {
        return new Constraint[] {
                // Hard constraints - these must never be broken
                teacherConflict(constraintFactory),
                roomConflict(constraintFactory),
                teacherLacksInstrument(constraintFactory),
                maxStudentsPerLesson(constraintFactory),
                studentHasWrongInstrument(constraintFactory),

                // Soft constraints - these should be avoided, but a schedule that breaks
                // them is still a usable schedule
                classTooSmall(constraintFactory),
                emptyClass(constraintFactory),
                studentDoesNotPreferTime(constraintFactory),
                teacherDoesNotPreferTime(constraintFactory),
                teacherOutsidePreferredRoom(constraintFactory),
                siblingsScheduledApart(constraintFactory),
                preferEarlierTimeSlots(constraintFactory),
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

    Constraint roomConflict(ConstraintFactory constraintFactory) {
        // Two classes cannot share a room at the same time.
        return constraintFactory.forEach(Lesson.class)
                .join(Lesson.class,
                        Joiners.equal(Lesson::getTimeSlot),
                        Joiners.equal(Lesson::getRoom),
                        Joiners.lessThan(Lesson::getId))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Room Conflict");
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
                .penalize(HardSoftScore.ofSoft(SchedulingRules.SMALL_CLASS_PENALTY),
                        (lesson, count) -> SchedulingRules.MIN_STUDENTS_PER_CLASS - count)
                .asConstraint("Class Too Small");
    }

    Constraint emptyClass(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .ifNotExists(StudentAssignment.class,
                        Joiners.equal(lesson -> lesson, StudentAssignment::getLesson))
                .penalize(HardSoftScore.ofSoft(
                        SchedulingRules.SMALL_CLASS_PENALTY * SchedulingRules.MIN_STUDENTS_PER_CLASS))
                .asConstraint("Empty Class");
    }

    Constraint studentDoesNotPreferTime(ConstraintFactory factory) {
        return factory.forEach(StudentAssignment.class)
                .join(Lesson.class,
                        Joiners.equal(StudentAssignment::getLesson, (Lesson lesson) -> lesson))
                .filter((sa, lesson) -> isOutsidePreference(
                        lessonStartOf(lesson), sa.getStudent().getPreferredTimeRange()))
                .penalize(HardSoftScore.ofSoft(SchedulingRules.PREFERRED_TIME_PENALTY),
                        (sa, lesson) -> slotsOutsidePreference(
                                lessonStartOf(lesson),
                                sa.getStudent().getPreferredTimeRange(),
                                lesson.getDuration()))
                .asConstraint("Student Does Not Prefer Time");
    }

    Constraint teacherDoesNotPreferTime(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> isOutsidePreference(
                        lessonStartOf(lesson), lesson.getTeacher().getPreferredTimeRange()))
                .penalize(HardSoftScore.ofSoft(SchedulingRules.PREFERRED_TIME_PENALTY),
                        lesson -> slotsOutsidePreference(
                                lessonStartOf(lesson),
                                lesson.getTeacher().getPreferredTimeRange(),
                                lesson.getDuration()))
                .asConstraint("Teacher Does Not Prefer Time");
    }

    Constraint teacherOutsidePreferredRoom(ConstraintFactory factory) {
        // Teachers keep their gear, their stands and their music in one place, so a teacher who
        // holds one room all evening has an easier night than one who moves every class.
        return factory.forEach(Lesson.class)
                .filter(lesson -> lesson.getTeacher().hasPreferredRoom()
                        && !lesson.getTeacher().getPreferredRoomId()
                        .equals(lesson.getRoom().getKey()))
                .penalize(HardSoftScore.ofSoft(SchedulingRules.TEACHER_ROOM_PENALTY))
                .asConstraint("Teacher Outside Preferred Room");
    }

    Constraint siblingsScheduledApart(ConstraintFactory factory) {
        // Siblings should be at the club at roughly the same time, so a parent makes one
        // trip and one wait instead of two. Every pair of students sharing a familyId is
        // penalised in proportion to how many time slots separate their classes.
        return factory.forEach(StudentAssignment.class)
                .filter(TimeTableConstraintProvider::hasSiblingGroup)
                .join(Lesson.class,
                        Joiners.equal(StudentAssignment::getLesson, (Lesson lesson) -> lesson))
                .join(StudentAssignment.class,
                        Joiners.equal((sa, lesson) -> sa.getStudent().getFamilyId(),
                                (StudentAssignment other) -> other.getStudent().getFamilyId()),
                        Joiners.lessThan((sa, lesson) -> sa.getId(), StudentAssignment::getId))
                .filter((sa, lesson, other) -> hasSiblingGroup(other))
                .join(Lesson.class,
                        Joiners.equal((sa, lesson, other) -> other.getLesson(),
                                (Lesson otherLesson) -> otherLesson))
                .filter((sa, lesson, other, otherLesson) -> slotsApart(lesson, otherLesson) > 0)
                .penalize(HardSoftScore.ofSoft(SchedulingRules.SIBLING_GAP_PENALTY),
                        (sa, lesson, other, otherLesson) -> slotsApart(lesson, otherLesson))
                .asConstraint("Siblings Scheduled Apart");
    }

    Constraint preferEarlierTimeSlots(ConstraintFactory factory) {
        // Fill the evening from the front.
        // Every class is charged once for each time slot that starts before it.
        return factory.forEach(Lesson.class)
                .join(TimeSlot.class,
                        Joiners.greaterThan(
                                (Lesson lesson) -> lesson.getTimeSlot().getStartTime(),
                                (TimeSlot slot) -> slot.getStartTime()))
                .penalize(HardSoftScore.ofSoft(SchedulingRules.LATE_SLOT_PENALTY))
                .asConstraint("Prefer Earlier Time Slots");
    }

    // ------------------------------------------------------- shared helpers

    private static boolean hasSiblingGroup(StudentAssignment sa) {
        return sa.getStudent() != null && sa.getStudent().getFamilyId() != null;
    }

    static int slotsApart(Lesson a, Lesson b) {
        LocalTime startA = lessonStartOf(a);
        LocalTime startB = lessonStartOf(b);
        if (startA == null || startB == null) {
            return 0;
        }
        long minutesApart = Math.abs(Duration.between(startA, startB).toMinutes());
        long slotLength = Math.max(1, a.getDuration());
        return (int) (minutesApart / slotLength);
    }

    static int slotsApart(StudentAssignment a, StudentAssignment b) {
        if (a.getLesson() == null || b.getLesson() == null) {
            return 0;
        }
        return slotsApart(a.getLesson(), b.getLesson());
    }

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
            return false;
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