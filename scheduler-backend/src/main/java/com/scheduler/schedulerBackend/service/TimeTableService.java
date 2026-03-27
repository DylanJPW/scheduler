package com.scheduler.schedulerBackend.service;

import com.scheduler.schedulerBackend.model.TimeTable;
import com.scheduler.schedulerBackend.model.TimeTableDTO;
import com.scheduler.schedulerBackend.model.TimeTableMapper;
import org.optaplanner.core.api.solver.SolverJob;
import org.optaplanner.core.api.solver.SolverManager;
import org.springframework.stereotype.Service;


import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
public class TimeTableService {

    private final SolverManager<TimeTable, UUID> solverManager;
    private final TimeTableMapper mapper;

    public TimeTableService(SolverManager<TimeTable, UUID> solverManager,
                            TimeTableMapper mapper) {
        this.solverManager = solverManager;
        this.mapper = mapper;
    }

    public TimeTableDTO solve(TimeTable problem) {
        problem.generateSchedule();

        UUID problemId = UUID.randomUUID();
        SolverJob<TimeTable, UUID> solverJob = solverManager.solve(problemId, problem);
        TimeTable solution;
        try {
            solution = solverJob.getFinalBestSolution();
        } catch (InterruptedException | ExecutionException e) {
            throw new IllegalStateException("Solving failed.", e);
        }
        return mapper.toTimeTableDTOs(solution);
    }
}
