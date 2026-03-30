package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.enums.Instrument;
import com.scheduler.schedulerBackend.enums.SkillLevel;

public class Student extends Person {
    private Instrument instrument;
    private SkillLevel skillLevel;

    public Student(String name, Instrument instrument, SkillLevel skillLevel) {
        super(name);
        this.instrument = instrument;
        this.skillLevel = skillLevel;
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

    @Override
    public String toString() {
        return name + " is learning how to play the " + instrument + " at " + skillLevel + " level ";
    }
}
