package com.scheduler.schedulerBackend.model;

import java.util.List;

public class TimeTableDTO {
    private List<LessonDTO> lessonList;
    private List<TimeSlot> timeSlotList;

    public TimeTableDTO(List<LessonDTO> lessonList, List<TimeSlot> timeSlotList) {
        this.lessonList = lessonList;
        this.timeSlotList = timeSlotList;
    }

    public List<LessonDTO> getLessonList() {
        return lessonList;
    }

    public void setLessonList(List<LessonDTO> lessonList) {
        this.lessonList = lessonList;
    }

    public List<TimeSlot> getTimeSlotList() {
        return timeSlotList;
    }

    public void setTimeSlotList(List<TimeSlot> timeSlotList) {
        this.timeSlotList = timeSlotList;
    }
}
