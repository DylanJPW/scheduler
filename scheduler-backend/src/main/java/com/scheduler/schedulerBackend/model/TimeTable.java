package com.scheduler.schedulerBackend.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.scheduler.schedulerBackend.config.SchedulingRules;
import com.scheduler.schedulerBackend.enums.Instrument;
import com.scheduler.schedulerBackend.utils.LocalTimeDeserialiser;
import org.optaplanner.core.api.domain.solution.PlanningEntityCollectionProperty;
import org.optaplanner.core.api.domain.solution.PlanningScore;
import org.optaplanner.core.api.domain.solution.PlanningSolution;
import org.optaplanner.core.api.domain.solution.ProblemFactCollectionProperty;
import org.optaplanner.core.api.domain.valuerange.ValueRangeProvider;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;

import java.time.Duration;
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
        generateSchedule();
    }

    public final void generateSchedule() {
        validate();

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

    private void validate() {
        if (dayStart == null || dayEnd == null) {
            throw new IllegalArgumentException("dayStart and dayEnd are both required.");
        }
        if (!dayStart.isBefore(dayEnd)) {
            throw new IllegalArgumentException(
                    "dayStart (" + dayStart + ") must be before dayEnd (" + dayEnd + ").");
        }
        if (lengthOfLesson < SchedulingRules.MIN_LESSON_MINUTES
                || lengthOfLesson > SchedulingRules.MAX_LESSON_MINUTES) {
            throw new IllegalArgumentException(
                    "lengthOfLesson must be between " + SchedulingRules.MIN_LESSON_MINUTES
                            + " and " + SchedulingRules.MAX_LESSON_MINUTES
                            + " minutes, but was " + lengthOfLesson + ".");
        }
        if (studentList == null || studentList.isEmpty()) {
            throw new IllegalArgumentException("At least one student is required.");
        }
        if (teacherList == null || teacherList.isEmpty()) {
            throw new IllegalArgumentException("At least one teacher is required.");
        }
        if (Duration.between(dayStart, dayEnd).toMinutes() < lengthOfLesson) {
            throw new IllegalArgumentException(
                    "The evening is shorter than one class: " + dayStart + "-" + dayEnd
                            + " cannot fit a " + lengthOfLesson + " minute class.");
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

            int lessonCount = (int) Math.ceil(
                    studentCount / (double) SchedulingRules.MAX_STUDENTS_PER_CLASS);

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

        while (!currentStart.plusMinutes(lessonLength).isAfter(end)) {
            LocalTime currentEnd = currentStart.plusMinutes(lessonLength);
            slots.add(new TimeSlot(currentStart, currentEnd));
            currentStart = currentEnd;
        }
        return slots;
    }

    public long getUnusedMinutes() {
        if (dayStart == null || dayEnd == null || lengthOfLesson <= 0) {
            return 0;
        }
        return Duration.between(dayStart, dayEnd).toMinutes() % lengthOfLesson;
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

    public LocalTime getDayStart() {
        return dayStart;
    }

    public void setDayStart(LocalTime dayStart) {
        this.dayStart = dayStart;
    }

    public LocalTime getDayEnd() {
        return dayEnd;
    }

    public void setDayEnd(LocalTime dayEnd) {
        this.dayEnd = dayEnd;
    }

    public int getLengthOfLesson() {
        return lengthOfLesson;
    }

    public void setLengthOfLesson(int lengthOfLesson) {
        this.lengthOfLesson = lengthOfLesson;
    }
}