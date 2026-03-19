package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.enums.Instrument;
import org.optaplanner.core.api.domain.entity.PlanningEntity;
import org.optaplanner.core.api.domain.lookup.PlanningId;
import org.optaplanner.core.api.domain.variable.PlanningVariable;

import java.util.List;

@PlanningEntity
public class Lesson {

    @PlanningId
    private Long id;

    private Instrument instrument;
    private List<Student> students;

    @PlanningVariable
    private Teacher teacher;

    @PlanningVariable
    private TimeSlot timeSlot;

    public Lesson() {
    }

    public Lesson(Long id, Instrument instrument, List<Student> students) {
        this.id = id;
        this.instrument = instrument;
        this.students = students;
    }

    public Long getId() {
        return id;
    }

    public Instrument getInstrument() {
        return instrument;
    }

    public void setInstrument(Instrument instrument) {
        this.instrument = instrument;
    }

    public Teacher getTeacher() {
        return teacher;
    }

    public void setTeacher(Teacher teacher) {
        this.teacher = teacher;
    }

    public List<Student> getStudents() {
        return students;
    }

    public void setStudents(List<Student> students) {
        this.students = students;
    }

    public TimeSlot getTimeslot() {
        return timeSlot;
    }

    public void setTimeslot(TimeSlot timeslot) {
        this.timeSlot = timeslot;
    }

    @Override
    public String toString() {
        return "Lesson for " + instrument +
                " taught by " + teacher +
                " at " + timeSlot +
                " with students: " + students;
    }
}
