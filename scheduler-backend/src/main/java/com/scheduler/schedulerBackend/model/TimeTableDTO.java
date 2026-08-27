package com.scheduler.schedulerBackend.model;

import java.util.List;

public class TimeTableDTO {

    private List<LessonDTO> lessonList;
    private List<TimeSlot> timeSlotList;
    private List<Room> roomList;

    private String score;
    private boolean feasible;

    private int hardScore;
    private int softScore;

    private long unusedMinutes;
    private int emptyClassCount;

    private int minStudentsPerClass;
    private int maxStudentsPerClass;

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

    public List<Room> getRoomList() {
        return roomList;
    }

    public void setRoomList(List<Room> roomList) {
        this.roomList = roomList;
    }

    public String getScore() {
        return score;
    }

    public void setScore(String score) {
        this.score = score;
    }

    public boolean isFeasible() {
        return feasible;
    }

    public void setFeasible(boolean feasible) {
        this.feasible = feasible;
    }

    public int getHardScore() {
        return hardScore;
    }

    public void setHardScore(int hardScore) {
        this.hardScore = hardScore;
    }

    public int getSoftScore() {
        return softScore;
    }

    public void setSoftScore(int softScore) {
        this.softScore = softScore;
    }

    public long getUnusedMinutes() {
        return unusedMinutes;
    }

    public void setUnusedMinutes(long unusedMinutes) {
        this.unusedMinutes = unusedMinutes;
    }

    public int getEmptyClassCount() {
        return emptyClassCount;
    }

    public void setEmptyClassCount(int emptyClassCount) {
        this.emptyClassCount = emptyClassCount;
    }

    public int getMinStudentsPerClass() {
        return minStudentsPerClass;
    }

    public void setMinStudentsPerClass(int minStudentsPerClass) {
        this.minStudentsPerClass = minStudentsPerClass;
    }

    public int getMaxStudentsPerClass() {
        return maxStudentsPerClass;
    }

    public void setMaxStudentsPerClass(int maxStudentsPerClass) {
        this.maxStudentsPerClass = maxStudentsPerClass;
    }
}