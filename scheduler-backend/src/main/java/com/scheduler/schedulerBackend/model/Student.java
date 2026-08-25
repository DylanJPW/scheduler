package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.enums.Instrument;
import com.scheduler.schedulerBackend.enums.SkillLevel;

import java.util.Locale;

public class Student extends Person {
    private Instrument instrument;
    private SkillLevel skillLevel;

    private String familyId;

    public Student() {
    }

    public Student(String name, Instrument instrument, SkillLevel skillLevel) {
        super(name);
        this.instrument = instrument;
        this.skillLevel = skillLevel;
    }

    public Student(String name, TimeSlot preferredTimeRange, Instrument instrument, SkillLevel skillLevel) {
        super(name, preferredTimeRange);
        this.instrument = instrument;
        this.skillLevel = skillLevel;
    }

    public Student(String name, Instrument instrument, SkillLevel skillLevel, String familyId) {
        this(name, instrument, skillLevel);
        setFamilyId(familyId);
    }

    public Student(String name, TimeSlot preferredTimeRange, Instrument instrument, SkillLevel skillLevel,
                   String familyId) {
        this(name, preferredTimeRange, instrument, skillLevel);
        setFamilyId(familyId);
    }

    public Instrument getInstrument() {
        return instrument;
    }

    public void setInstrument(Instrument instrument) {
        this.instrument = instrument;
    }

    public SkillLevel getSkillLevel() {
        return skillLevel;
    }

    public void setSkillLevel(SkillLevel skillLevel) {
        this.skillLevel = skillLevel;
    }

    public String getFamilyId() {
        return familyId;
    }

    public void setFamilyId(String familyId) {
        if (familyId == null || familyId.isBlank()) {
            this.familyId = null;
        } else {
            this.familyId = familyId.trim().toLowerCase(Locale.ROOT);
        }
    }

    public boolean hasSiblingGroup() {
        return familyId != null;
    }

    @Override
    public String toString() {
        return name + " (" + skillLevel + " " + instrument
                + (familyId == null ? "" : ", family " + familyId) + ")";
    }
}