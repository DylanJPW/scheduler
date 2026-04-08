package com.scheduler.schedulerBackend.model;

import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.optaplanner.core.api.score.stream.*;

import java.time.Duration;
import java.time.LocalTime;

public class TimeTableConstraintProvider implements ConstraintProvider {
    @Override
    public Constraint[] defineConstraints(ConstraintFactory constraintFactory) {
        return new Constraint[] {
                // Hard constraints
                teacherConflict(constraintFactory),
                teacherLacksInstrument(constraintFactory),
                minStudentsPerLesson(constraintFactory),
                maxStudentsPerLesson(constraintFactory),
                studentHasWrongInstrument(constraintFactory),

                // Soft constraints
                studentDoesNotPreferTime(constraintFactory),
        };
    }

    private Constraint teacherConflict(ConstraintFactory constraintFactory) {
        // A teacher can only teach one lesson at a time
        return constraintFactory.forEach(Lesson.class)
                .join(Lesson.class,
                        Joiners.equal(Lesson::getTimeSlot),
                        Joiners.equal(Lesson::getTeacher),
                        Joiners.lessThan(Lesson::getId))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Teacher Conflict");
    }

    private Constraint teacherLacksInstrument(ConstraintFactory constraintFactory) {
        // A teacher can only teach what they can play
        return constraintFactory.forEach(Lesson.class)
                .filter(lesson -> !lesson.getTeacher().getInstruments().contains(lesson.getInstrument()))
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Teacher Lacks Instrument");
    }

    private Constraint minStudentsPerLesson(ConstraintFactory factory) {
        return factory.forEach(StudentAssignment.class)
                .groupBy(StudentAssignment::getLesson, ConstraintCollectors.count())
                .filter((lesson, count) -> count < 2)
                .penalize(HardSoftScore.ONE_HARD,
                        (lesson, count) -> 2 - count)
                .asConstraint("Min Students Per Lesson");
    }

    private Constraint maxStudentsPerLesson(ConstraintFactory factory) {
        return factory.forEach(StudentAssignment.class)
                .groupBy(StudentAssignment::getLesson, ConstraintCollectors.count())
                .filter((lesson, count) -> count > 6)
                .penalize(HardSoftScore.ONE_HARD,
                        (lesson, count) -> count - 6)
                .asConstraint("Max Students Per Lesson");
    }

    private Constraint studentHasWrongInstrument(ConstraintFactory factory) {
        return factory.forEach(StudentAssignment.class)
                .filter(sa -> sa.getStudent().getInstrument() != sa.getLesson().getInstrument())
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Student Has Wrong Instrument");
    }

    private Constraint studentDoesNotPreferTime(ConstraintFactory factory) {
        return factory.forEach(StudentAssignment.class)
                .filter(sa -> {
                    if (sa.getStudent().getPreferredTimeRange() == null || sa.getLesson().getTimeSlot() == null) {return false;}

                    LocalTime lessonStart = sa.getLesson().getTimeSlot().getStartTime();
                    LocalTime prefStart = sa.getStudent().getPreferredTimeRange().getStartTime();
                    LocalTime prefEnd = sa.getStudent().getPreferredTimeRange().getEndTime();

                    return lessonStart.isBefore(prefStart) || lessonStart.isAfter(prefEnd);
                })
                .penalize(HardSoftScore.ONE_SOFT,
                        sa -> {
                            LocalTime lessonStart = sa.getLesson().getTimeSlot().getStartTime();
                            LocalTime prefStart = sa.getStudent().getPreferredTimeRange().getStartTime();
                            LocalTime prefEnd = sa.getStudent().getPreferredTimeRange().getEndTime();

                            long lessonLength = sa.getLesson().getDuration();
                            long minutesDiff = lessonStart.isBefore(prefStart)
                                    ? Duration.between(lessonStart, prefStart).toMinutes()
                                    : Duration.between(prefEnd, lessonStart).toMinutes();

                            return (int) (minutesDiff / lessonLength);
                        }
                )
                .asConstraint("Student Does Not Prefer Time");
    }

    private Constraint teacherDoesNotPreferTime(ConstraintFactory factory) {
        return factory.forEach(Lesson.class)
                .filter(lesson -> {
                    LocalTime lessonStart = lesson.getTimeSlot().getStartTime();
                    LocalTime prefStart = lesson.getTeacher().getPreferredTimeRange().getStartTime();
                    LocalTime prefEnd = lesson.getTeacher().getPreferredTimeRange().getEndTime();

                    return lessonStart.isBefore(prefStart) || lessonStart.isAfter(prefEnd);
                })
                .penalize(HardSoftScore.ONE_SOFT,
                        lesson -> {
                            LocalTime lessonStart = lesson.getTimeSlot().getStartTime();
                            LocalTime prefStart = lesson.getTeacher().getPreferredTimeRange().getStartTime();
                            LocalTime prefEnd = lesson.getTeacher().getPreferredTimeRange().getEndTime();

                            long lessonLength = lesson.getDuration();
                            long minutesDiff = lessonStart.isBefore(prefStart)
                                    ? Duration.between(lessonStart, prefStart).toMinutes()
                                    : Duration.between(prefEnd, lessonStart).toMinutes();

                            return (int) (minutesDiff / lessonLength);
                        }
                )
                .asConstraint("Teacher Does Not Prefer Time");
    }
}
