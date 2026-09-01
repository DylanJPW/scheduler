package com.scheduler.schedulerBackend.model;

import java.util.Locale;

public abstract class Person {

    protected String id;

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

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = (id == null || id.isBlank()) ? null : id.trim();
    }

    public String getKey() {
        return id != null ? id : (name == null ? "" : name.trim().toLowerCase(Locale.ROOT));
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