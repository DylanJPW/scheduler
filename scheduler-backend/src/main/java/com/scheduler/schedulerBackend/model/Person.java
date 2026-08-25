package com.scheduler.schedulerBackend.model;

public abstract class Person {
    protected String name;
    protected TimeSlot preferredTimeRange;

    public Person() {
    }

    public Person(String name) {
        this.name = name;
    }

    public Person(String name, TimeSlot preferredTimeRange) {
        this.name = name;
        this.preferredTimeRange = preferredTimeRange;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public TimeSlot getPreferredTimeRange() {
        return preferredTimeRange;
    }

    public void setPreferredTimeRange(TimeSlot preferredTimeRange) {
        this.preferredTimeRange = preferredTimeRange;
    }
}
