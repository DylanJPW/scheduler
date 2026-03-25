package com.scheduler.schedulerBackend.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.scheduler.schedulerBackend.enums.Instrument;
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
import java.util.Map;
import java.util.stream.Collectors;

@PlanningSolution
public class TimeTable {

    @ValueRangeProvider(id = "timeSlotRange")
    @ProblemFactCollectionProperty
    private List<TimeSlot> timeSlotList;

    @ValueRangeProvider(id = "teacherRange")
    @ProblemFactCollectionProperty
    private List<Teacher> teacherList;

    @ProblemFactCollectionProperty
    private List<Student> studentList;

    @ValueRangeProvider(id = "lessonRange")
    @PlanningEntityCollectionProperty
    private List<Lesson> lessonList;

    @PlanningEntityCollectionProperty
    private List<StudentAssignment> studentAssignmentList;

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
        this.studentAssignmentList = new ArrayList<>();
    }

    public TimeTable(List<Teacher> teacherList,
                     List<Student> studentList,
                     LocalTime dayStart,
                     LocalTime dayEnd,
                     int lengthOfLesson) {

        this.teacherList = teacherList;
        this.studentList = studentList;
        this.dayStart = dayStart;
        this.dayEnd = dayEnd;
        this.lengthOfLesson = lengthOfLesson;
        this.timeSlotList = generateTimeSlots(dayStart, dayEnd, lengthOfLesson);
        this.lessonList = generateLessons(studentList);
        this.studentAssignmentList = generateStudentAssignments(studentList);
    }

    public void generateSchedule() {
        if (this.timeSlotList == null || this.timeSlotList.isEmpty()) {
            this.timeSlotList = generateTimeSlots(dayStart, dayEnd, lengthOfLesson);
        }
        if (this.lessonList == null || this.lessonList.isEmpty()) {
            this.lessonList = generateLessons(studentList);
        }
        if (this.studentAssignmentList == null || this.studentAssignmentList.isEmpty()) {
            this.studentAssignmentList = generateStudentAssignments(studentList);
        }
    }

    private List<Lesson> generateLessons(List<Student> students) {
        Map<Instrument, List<Student>> byInstrument =
                students.stream().collect(Collectors.groupingBy(Student::getInstrument));

        List<Lesson> lessons = new ArrayList<>();
        long id = 0;

        for (var entry : byInstrument.entrySet()) {
            Instrument instrument = entry.getKey();
            int studentCount = entry.getValue().size();

            int lessonCount = (int) Math.ceil(studentCount / 6.0);

            for (int i = 0; i < lessonCount; i++) {
                lessons.add(new Lesson(id++, instrument));
            }
        }

        return lessons;
    }

    private List<StudentAssignment> generateStudentAssignments(List<Student> students) {
        List<StudentAssignment> assignments = new ArrayList<>();

        long id = 0;
        for (Student student : students) {
            assignments.add(new StudentAssignment(id++, student));
        }

        return assignments;
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

    public List<TimeSlot> getTimeSlotList() {
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

    public List<StudentAssignment> getStudentAssignmentList() {
        return studentAssignmentList;
    }

    public void setStudentAssignmentList(List<StudentAssignment> studentAssignmentList) {
        this.studentAssignmentList = studentAssignmentList;
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
