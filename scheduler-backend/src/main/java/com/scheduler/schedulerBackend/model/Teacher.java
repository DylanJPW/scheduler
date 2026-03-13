package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.enums.Instrument;

import java.util.List;

public class Teacher {
    private String name;
    private List<Instrument> instruments;

    public Teacher(String name, List<Instrument> instruments) {
        this.name = name;
        this.instruments = instruments;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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
