package com.scheduler.schedulerBackend.model;

import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.optaplanner.core.api.score.stream.*;

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
                .filter(assignment -> assignment.getStudent().getInstrument() != assignment.getLesson().getInstrument())
                .penalize(HardSoftScore.ONE_HARD)
                .asConstraint("Student Has Wrong Instrument");
    }
}
