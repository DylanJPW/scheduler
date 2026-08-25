package com.scheduler.schedulerBackend.service;

import com.scheduler.schedulerBackend.model.TimeTable;
import com.scheduler.schedulerBackend.model.TimeTableDTO;
import com.scheduler.schedulerBackend.model.TimeTableMapper;
import org.optaplanner.core.api.solver.SolverJob;
import org.optaplanner.core.api.solver.SolverManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
public class TimeTableService {

    private static final Logger log = LoggerFactory.getLogger(TimeTableService.class);

    private final SolverManager<TimeTable, UUID> solverManager;
    private final TimeTableMapper mapper;

    public TimeTableService(SolverManager<TimeTable, UUID> solverManager,
                            TimeTableMapper mapper) {
        this.solverManager = solverManager;
        this.mapper = mapper;
    }

    public TimeTableDTO solve(TimeTable problem) {
        problem.generateSchedule();

        log.info("Solving: {} students, {} teachers, {} classes, {} time slots",
                problem.getStudentList().size(),
                problem.getTeacherList().size(),
                problem.getLessonList().size(),
                problem.getTimeSlotList().size());

        UUID problemId = UUID.randomUUID();
        SolverJob<TimeTable, UUID> solverJob = solverManager.solve(problemId, problem);
        TimeTable solution;
        try {
            solution = solverJob.getFinalBestSolution();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Solving was interrupted.", e);
        } catch (ExecutionException e) {
            throw new IllegalStateException("Solving failed.", e);
        }

        log.info("Solved with score {}", solution.getScore());
        return mapper.toTimeTableDTOs(solution);
    }
}