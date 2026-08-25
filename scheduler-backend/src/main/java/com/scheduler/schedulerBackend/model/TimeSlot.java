package com.scheduler.schedulerBackend.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.scheduler.schedulerBackend.utils.LocalTimeDeserialiser;

import java.time.LocalTime;

public class TimeSlot {
    @JsonDeserialize(using = LocalTimeDeserialiser.class)
    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonDeserialize(using = LocalTimeDeserialiser.class)
    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    public TimeSlot() {
    }

    public TimeSlot(LocalTime startTime, LocalTime endTime) {
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    @Override
    public String toString() {
        return startTime.toString();
    }
}
