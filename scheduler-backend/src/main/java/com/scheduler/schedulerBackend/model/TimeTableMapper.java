package com.scheduler.schedulerBackend.model;

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
                .map(lesson -> new LessonDTO(
                        lesson,
                        lessonStudentMap.getOrDefault(lesson, List.of())
                ))
                .toList();
    }

    public TimeTableDTO toTimeTableDTOs(TimeTable solution) {
        List<LessonDTO> lessonList = toLessonDTOs(solution);
        List<TimeSlot> timeSlotList = solution.getTimeSlotList();

        return new TimeTableDTO(lessonList, timeSlotList);
    }
}
