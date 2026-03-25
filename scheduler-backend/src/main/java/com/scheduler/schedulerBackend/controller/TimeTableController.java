package com.scheduler.schedulerBackend.controller;

import com.scheduler.schedulerBackend.model.*;
import com.scheduler.schedulerBackend.service.TimeTableService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/timeTable")
@CrossOrigin(origins="http://localhost:5173")
public class TimeTableController {

    private final TimeTableService timeTableService;

    public TimeTableController(TimeTableService timeTableService) {
        this.timeTableService = timeTableService;
    }

    @PostMapping("/solve")
    public TimeTableDTO solve(@RequestBody TimeTable problem) {
        return timeTableService.solve(problem);
    }
}
