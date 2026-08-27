package com.scheduler.schedulerBackend.config;

public final class SchedulingRules {

    /** A class with fewer students than this is allowed, but heavily discouraged. */
    public static final int MIN_STUDENTS_PER_CLASS = 2;

    /** A class may never have more students than this. */
    public static final int MAX_STUDENTS_PER_CLASS = 6;

    /** Sanity bounds on the length of a class, in minutes. */
    public static final int MIN_LESSON_MINUTES = 5;
    public static final int MAX_LESSON_MINUTES = 240;

    /** Soft penalty charged per time slot by which a class sits later than the first slot of the evening. */
    public static final int LATE_SLOT_PENALTY = 1;

    /** Soft penalty charged per time slot a student or teacher is placed outside their preferred range. */
    public static final int PREFERRED_TIME_PENALTY = 10;

    /** Soft penalty charged per class a teacher teaches outside the room they asked for. */
    public static final int TEACHER_ROOM_PENALTY = 30;

    /** Soft penalty charged per time slot of gap between two siblings' classes. */
    public static final int SIBLING_GAP_PENALTY = 100;

    /** Soft penalty charged per student a class is short of MIN_STUDENTS_PER_CLASS. */
    public static final int SMALL_CLASS_PENALTY = 1000;

    private SchedulingRules() {}
}