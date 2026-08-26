package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.enums.Instrument;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

public class Teacher extends Person {
    private List<Instrument> instruments;

    private String preferredRoomId;

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

    public Teacher(String name, List<Instrument> instruments, String preferredRoomId) {
        this(name, instruments);
        setPreferredRoomId(preferredRoomId);
    }

    public String getPreferredRoomId() {
        return preferredRoomId;
    }

    public void setPreferredRoomId(String preferredRoomId) {
        this.preferredRoomId = (preferredRoomId == null || preferredRoomId.isBlank())
                ? null
                : preferredRoomId.trim().toLowerCase(Locale.ROOT);
    }

    public boolean hasPreferredRoom() {
        return preferredRoomId != null;
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