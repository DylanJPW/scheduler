package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.enums.Instrument;

import java.util.List;
import java.util.stream.Collectors;

public class Teacher extends Person {
    private List<Instrument> instruments;

    public Teacher() {
    }

    public Teacher(String name, List<Instrument> instruments) {
        super(name);
        this.instruments = instruments;
    }

    public Teacher(String name, TimeSlot preferredTimeRange, List<Instrument> instruments) {
        super(name, preferredTimeRange);
        this.instruments = instruments;
    }

    public List<Instrument> getInstruments() {
        return instruments;
    }

    public void setInstruments(List<Instrument> instruments) {
        this.instruments = instruments;
    }

    @Override
    public String toString() {
        if (instruments == null || instruments.isEmpty()) {
            return name + " (teaches nothing)";
        }
        return name + " (" + instruments.stream()
                .map(Instrument::name)
                .collect(Collectors.joining(", ")) + ")";
    }
}