package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.enums.Instrument;

import java.util.List;

public class LessonDTO {

    private Long id;
    private Instrument instrument;
    private TimeSlot timeSlot;
    private Teacher teacher;
    private List<Student> students;

    public LessonDTO(Lesson lesson, List<Student> students) {
        this.id = lesson.getId();
        this.instrument = lesson.getInstrument();
        this.timeSlot = lesson.getTimeSlot();
        this.teacher = lesson.getTeacher();
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

    public TimeSlot getTimeSlot() {
        return timeSlot;
    }

    public void setTimeSlot(TimeSlot timeSlot) {
        this.timeSlot = timeSlot;
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
}
