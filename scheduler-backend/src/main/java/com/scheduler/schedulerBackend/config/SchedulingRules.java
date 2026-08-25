package com.scheduler.schedulerBackend.config;

public final class SchedulingRules {

    /** A class with fewer students than this is allowed, but heavily discouraged. */
    public static final int MIN_STUDENTS_PER_CLASS = 2;

    /** A class may never have more students than this. */
    public static final int MAX_STUDENTS_PER_CLASS = 6;

    /** Sanity bounds on the length of a class, in minutes. */
    public static final int MIN_LESSON_MINUTES = 5;
    public static final int MAX_LESSON_MINUTES = 240;

    private SchedulingRules() {}
}