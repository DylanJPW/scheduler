package com.scheduler.schedulerBackend.model;

import org.optaplanner.core.api.domain.solution.PlanningEntityCollectionProperty;
import org.optaplanner.core.api.domain.solution.PlanningScore;
import org.optaplanner.core.api.domain.solution.PlanningSolution;
import org.optaplanner.core.api.domain.solution.ProblemFactCollectionProperty;
import org.optaplanner.core.api.domain.valuerange.ValueRangeProvider;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.springframework.cglib.core.Local;

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

    private LocalTime firstLessonStartTime;
    private LocalTime lastLessonEndTime;
    private int lengthOfLesson;

    public TimeTable() {
        this.lessonList = new ArrayList<>();
        this.timeSlotList = new ArrayList<>();
    }

    public TimeTable(List<Teacher> teacherList, List<Student> studentList,
                     LocalTime firstLessonStartTime, LocalTime lastLessonEndTime, int lengthOfLesson) {
        this.teacherList = teacherList;
        this.studentList = studentList;
        this.firstLessonStartTime = firstLessonStartTime;
        this.lastLessonEndTime = lastLessonEndTime;
        this.lengthOfLesson = lengthOfLesson;
        this.timeSlotList = generateTimeSlots(firstLessonStartTime, lastLessonEndTime, lengthOfLesson);
        this.lessonList = generateLessonsFromStudents(studentList);
    }

    public void generateSchedule() {
        if (this.timeSlotList == null || this.timeSlotList.isEmpty()) {
            this.timeSlotList = generateTimeSlots(firstLessonStartTime, lastLessonEndTime, lengthOfLesson);
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
        return firstLessonStartTime;
    }

    public void setFirstLessonStartTime(LocalTime firstLessonStartTime) {
        this.firstLessonStartTime = firstLessonStartTime;
    }

    public LocalTime getLastLessonEndTime() {
        return lastLessonEndTime;
    }

    public void setLastLessonEndTime(LocalTime lastLessonEndTime) {
        this.lastLessonEndTime = lastLessonEndTime;
    }

    public int getLengthOfLesson() {
        return lengthOfLesson;
    }

    public void setLengthOfLesson(int lengthOfLesson) {
        this.lengthOfLesson = lengthOfLesson;
    }
}
