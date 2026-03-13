package com.scheduler.schedulerBackend.model;

import org.optaplanner.core.api.domain.solution.PlanningEntityCollectionProperty;
import org.optaplanner.core.api.domain.solution.PlanningScore;
import org.optaplanner.core.api.domain.solution.PlanningSolution;
import org.optaplanner.core.api.domain.solution.ProblemFactCollectionProperty;
import org.optaplanner.core.api.domain.valuerange.ValueRangeProvider;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;

import java.util.List;

@PlanningSolution
public class TimeTable {

    @ValueRangeProvider
    @ProblemFactCollectionProperty
    private List<Timeslot> timeslotList;

    @ValueRangeProvider
    @ProblemFactCollectionProperty
    private List<Teacher> teacherList;

    @PlanningEntityCollectionProperty
    private List<Lesson> lessonList;

    @PlanningScore
    private HardSoftScore score;

    public TimeTable() {
    }

    public TimeTable(List<Timeslot> timeslotList, List<Teacher> teacherList, List<Lesson> lessonList) {
        this.timeslotList = timeslotList;
        this.teacherList = teacherList;
        this.lessonList = lessonList;
    }

    public List<Timeslot> getTimeslotList() {
        return timeslotList;
    }

    public List<Lesson> getLessonList() {
        return lessonList;
    }

    public List<Teacher> getTeacherList() {
        return teacherList;
    }

    public HardSoftScore getScore() {
        return score;
    }
}
