package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.config.SchedulingRules;
import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.springframework.stereotype.Component;

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
        List<LessonDTO> lessonList = toLessonDTOs(solution);

        TimeTableDTO dto = new TimeTableDTO(lessonList, solution.getTimeSlotList());

        HardSoftScore score = solution.getScore();
        if (score != null) {
            dto.setScore(score.toString());
            dto.setFeasible(score.isFeasible());
            dto.setHardScore(score.hardScore());
            dto.setSoftScore(score.softScore());
        }

        dto.setUnusedMinutes(solution.getUnusedMinutes());
        dto.setEmptyClassCount(solution.getLessonList().size() - lessonList.size());
        dto.setMinStudentsPerClass(SchedulingRules.MIN_STUDENTS_PER_CLASS);
        dto.setMaxStudentsPerClass(SchedulingRules.MAX_STUDENTS_PER_CLASS);

        return dto;
    }
}