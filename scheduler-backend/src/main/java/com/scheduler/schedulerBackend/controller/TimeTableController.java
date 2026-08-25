package com.scheduler.schedulerBackend.controller;

import com.scheduler.schedulerBackend.model.*;
import com.scheduler.schedulerBackend.service.TimeTableService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/timeTable")
@CrossOrigin(origins = "http://localhost:5173")
public class TimeTableController {

    private static final Logger log = LoggerFactory.getLogger(TimeTableController.class);

    private final TimeTableService timeTableService;

    public TimeTableController(TimeTableService timeTableService) {
        this.timeTableService = timeTableService;
    }

    @PostMapping("/solve")
    public TimeTableDTO solve(@RequestBody TimeTable problem) {
        return timeTableService.solve(problem);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadInput(IllegalArgumentException e) {
        log.warn("Rejected solve request: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage()));
    }
}