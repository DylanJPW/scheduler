package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.enums.Instrument;

import java.util.List;

public class Teacher extends Person {
    private List<Instrument> instruments;

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
        return name + " teaches:\n" + instruments.stream().map(((instrument) -> instrument + "\n" ));
    }
}
