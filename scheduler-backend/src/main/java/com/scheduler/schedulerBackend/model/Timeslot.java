package com.scheduler.schedulerBackend.model;

import java.time.LocalTime;

public class Timeslot {
    private LocalTime startTime;
    private LocalTime endTime;

    public Timeslot(LocalTime startTime, LocalTime endTime) {
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
