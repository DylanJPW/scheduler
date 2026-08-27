package com.scheduler.schedulerBackend.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.scheduler.schedulerBackend.enums.Instrument;
import com.scheduler.schedulerBackend.enums.SkillLevel;
import com.scheduler.schedulerBackend.utils.LocalDateDeserialiser;

import java.time.LocalDate;
import java.time.Period;
import java.util.Locale;

public class Student extends Person {
    private Instrument instrument;
    private SkillLevel skillLevel;

    private String familyId;

    @JsonDeserialize(using = LocalDateDeserialiser.class)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;

    private Integer ageInYears;

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

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public boolean hasDateOfBirth() {
        return dateOfBirth != null;
    }

    public Integer getAgeInYears() {
        return ageInYears;
    }

    public void setAgeInYears(Integer ageInYears) {
        this.ageInYears = ageInYears;
    }

    public boolean hasAge() {
        return ageInYears != null;
    }

    public void deriveAge(LocalDate referenceDate) {
        if (dateOfBirth == null || referenceDate == null || dateOfBirth.isAfter(referenceDate)) {
            this.ageInYears = null;
        } else {
            this.ageInYears = Period.between(dateOfBirth, referenceDate).getYears();
        }
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
                + (ageInYears == null ? "" : ", aged " + ageInYears)
                + (familyId == null ? "" : ", family " + familyId) + ")";
    }
}