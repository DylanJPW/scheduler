package com.scheduler.schedulerBackend.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.scheduler.schedulerBackend.utils.LocalTimeDeserialiser;
import org.optaplanner.core.api.domain.solution.PlanningEntityCollectionProperty;
import org.optaplanner.core.api.domain.solution.PlanningScore;
import org.optaplanner.core.api.domain.solution.PlanningSolution;
import org.optaplanner.core.api.domain.solution.ProblemFactCollectionProperty;
import org.optaplanner.core.api.domain.valuerange.ValueRangeProvider;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@PlanningSolution
public class TimeTable {

    @ValueRangeProvider
    @ProblemFactCollectionProperty
    private List<TimeSlot> timeSlotList;

    @ValueRangeProvider
    @ProblemFactCollectionProperty
    private List<Teacher> teacherList;

    @ProblemFactCollectionProperty
    private List<Student> studentList;

    @PlanningEntityCollectionProperty
    private List<Lesson> lessonList;

    @PlanningScore
    private HardSoftScore score;

    @JsonDeserialize(using = LocalTimeDeserialiser.class)
    @JsonFormat(pattern = "HH:mm")
    private LocalTime dayStart;

    @JsonDeserialize(using = LocalTimeDeserialiser.class)
    @JsonFormat(pattern = "HH:mm")
    private LocalTime dayEnd;

    private int lengthOfLesson;

    public TimeTable() {
        this.lessonList = new ArrayList<>();
        this.timeSlotList = new ArrayList<>();
    }

    public TimeTable(List<Teacher> teacherList, List<Student> studentList,
                     LocalTime dayStart, LocalTime dayEnd, int lengthOfLesson) {
        this.teacherList = teacherList;
        this.studentList = studentList;
        this.dayStart = dayStart;
        this.dayEnd = dayEnd;
        this.lengthOfLesson = lengthOfLesson;
        this.timeSlotList = generateTimeSlots(dayStart, dayEnd, lengthOfLesson);
        this.lessonList = generateLessonsFromStudents(studentList);
    }

    public void generateSchedule() {
        if (this.timeSlotList == null || this.timeSlotList.isEmpty()) {
            this.timeSlotList = generateTimeSlots(dayStart, dayEnd, lengthOfLesson);
        }
        if (this.lessonList == null || this.lessonList.isEmpty()) {
            this.lessonList = generateLessonsFromStudents(studentList);
        }
    }

    private List<TimeSlot> generateTimeSlots(LocalTime start, LocalTime end, int lessonLength) {
        List<TimeSlot> slots = new ArrayList<>();
        LocalTime currentStart = start;

        while (currentStart.plusMinutes(lessonLength).isBefore(end) || currentStart.plusMinutes(lessonLength).equals(end)) {
            LocalTime currentEnd = currentStart.plusMinutes(lessonLength);
            slots.add(new TimeSlot(currentStart, currentEnd));
            currentStart = currentEnd;
        }
        return slots;
    }

    private List<Lesson> generateLessonsFromStudents(List<Student> students) {
        return students.stream()
                .collect(Collectors.groupingBy(Student::getInstrument))
                .entrySet()
                .stream()
                .map(entry -> new Lesson(
                        (long) entry.getValue().hashCode(),
                        entry.getKey(),
                        entry.getValue()
                ))
                .collect(Collectors.toList());
    }

    public List<TimeSlot> getTimeslotList() {
        return timeSlotList;
    }

    public void setTimeSlotList(List<TimeSlot> timeSlotList) {
        this.timeSlotList = timeSlotList;
    }

    public List<Lesson> getLessonList() {
        return lessonList;
    }

    public void setLessonList(List<Lesson> lessonList) {
        this.lessonList = lessonList;
    }

    public List<Teacher> getTeacherList() {
        return teacherList;
    }

    public void setTeacherList(List<Teacher> teacherList) {
        this.teacherList = teacherList;
    }

    public List<Student> getStudentList() {
        return studentList;
    }

    public void setStudentList(List<Student> studentList) {
        this.studentList = studentList;
    }

    public HardSoftScore getScore() {
        return score;
    }

    public LocalTime getFirstLessonStartTime() {
        return dayStart;
    }

    public void setFirstLessonStartTime(LocalTime firstLessonStartTime) {
        this.dayStart = firstLessonStartTime;
    }

    public LocalTime getLastLessonEndTime() {
        return dayEnd;
    }

    public void setLastLessonEndTime(LocalTime lastLessonEndTime) {
        this.dayEnd = lastLessonEndTime;
    }

    public int getLengthOfLesson() {
        return lengthOfLesson;
    }

    public void setLengthOfLesson(int lengthOfLesson) {
        this.lengthOfLesson = lengthOfLesson;
    }
}
