package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.config.SchedulingRules;
import org.optaplanner.core.api.score.ScoreExplanation;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.optaplanner.core.api.score.constraint.ConstraintMatchTotal;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class TimeTableMapper {

    public List<LessonDTO> toLessonDTOs(TimeTable solution) {

        Map<Lesson, List<Student>> lessonStudentMap =
                solution.getStudentAssignmentList().stream()
                        .filter(sa -> sa.getLesson() != null)
                        .collect(Collectors.groupingBy(
                                StudentAssignment::getLesson,
                                Collectors.mapping(StudentAssignment::getStudent, Collectors.toList())
                        ));

        return solution.getLessonList().stream()
                .filter(lesson -> !lessonStudentMap.getOrDefault(lesson, List.of()).isEmpty())
                .map(lesson -> new LessonDTO(lesson, lessonStudentMap.get(lesson)))
                .toList();
    }

    public TimeTableDTO toTimeTableDTOs(TimeTable solution) {
        return toTimeTableDTOs(solution, null);
    }

    public TimeTableDTO toTimeTableDTOs(TimeTable solution,
                                        ScoreExplanation<TimeTable, HardSoftScore> explanation) {
        List<LessonDTO> lessonList = toLessonDTOs(solution);

        TimeTableDTO dto = new TimeTableDTO(lessonList, solution.getTimeSlotList());

        HardSoftScore score = solution.getScore();
        if (score != null) {
            dto.setScore(score.toString());
            dto.setFeasible(score.isFeasible());
            dto.setHardScore(score.hardScore());
            dto.setSoftScore(score.softScore());
        }

        dto.setRoomList(solution.getRoomList());
        dto.setUnusedMinutes(solution.getUnusedMinutes());
        dto.setEmptyClassCount(solution.getLessonList().size() - lessonList.size());
        dto.setMinStudentsPerClass(SchedulingRules.MIN_STUDENTS_PER_CLASS);
        dto.setMaxStudentsPerClass(SchedulingRules.MAX_STUDENTS_PER_CLASS);
        dto.setBrokenRules(toBrokenRules(explanation));

        return dto;
    }

    public List<BrokenRuleDTO> toBrokenRules(ScoreExplanation<TimeTable, HardSoftScore> explanation) {
        if (explanation == null) {
            return List.of();
        }
        return explanation.getConstraintMatchTotalMap().values().stream()
                .sorted(Comparator
                        .comparingInt((ConstraintMatchTotal<HardSoftScore> t) -> t.getScore().hardScore())
                        .thenComparingInt(t -> t.getScore().softScore()))
                .map(BrokenRuleDTO::from)
                .toList();
    }
}