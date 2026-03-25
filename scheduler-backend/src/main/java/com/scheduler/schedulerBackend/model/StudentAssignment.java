package com.scheduler.schedulerBackend.model;

import org.optaplanner.core.api.domain.entity.PlanningEntity;
import org.optaplanner.core.api.domain.variable.PlanningVariable;

@PlanningEntity
public class StudentAssignment {

    private Long id;
    private Student student;

    @PlanningVariable(valueRangeProviderRefs = "lessonRange")
    private Lesson lesson;

    public StudentAssignment() {
    }

    public StudentAssignment(Long id, Student student) {
        this.id = id;
        this.student = student;
    }

    public Long getId() {
        return id;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public Lesson getLesson() {
        return lesson;
    }

    public void setLesson(Lesson lesson) {
        this.lesson = lesson;
    }
}
