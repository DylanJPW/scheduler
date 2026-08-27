package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.enums.Instrument;
import com.scheduler.schedulerBackend.enums.SkillLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

class StudentTest {

    private static Student student(String familyId) {
        return new Student("Aoife", Instrument.FIDDLE, SkillLevel.BEGINNER, familyId);
    }

    @Test
    @DisplayName("a student with no family id has no sibling group")
    void noFamilyId() {
        assertNull(student(null).getFamilyId());
        assertFalse(student(null).hasSiblingGroup());
    }

    @Test
    @DisplayName("a blank family id is stored as no family, not as an empty-string family")
    void blankFamilyIdIsNoFamily() {
        assertNull(student("").getFamilyId());
        assertNull(student("   ").getFamilyId());
        assertFalse(student("  ").hasSiblingGroup());
    }

    @Test
    @DisplayName("family ids are trimmed and lower-cased so typing differences still match")
    void familyIdIsNormalised() {
        assertEquals("murphy", student("Murphy").getFamilyId());
        assertEquals("murphy", student("  murphy ").getFamilyId());
        assertEquals(student("MURPHY").getFamilyId(), student("murphy").getFamilyId());
    }

    @Test
    @DisplayName("the setter normalises too, not just the constructor")
    void setterNormalises() {
        Student student = student(null);
        student.setFamilyId(" Ní Bhriain ");
        assertEquals("ní bhriain", student.getFamilyId());
        assertTrue(student.hasSiblingGroup());

        student.setFamilyId("");
        assertNull(student.getFamilyId());
    }

    // ------------------------------------------------------------------ age

    private static final LocalDate SEPTEMBER = LocalDate.of(2026, 9, 3);

    private static int ageOf(String dateOfBirth) {
        return bornOn(dateOfBirth).getAgeInYears();
    }

    private static Student bornOn(String dateOfBirth) {
        Student student = student(null);
        student.setDateOfBirth(dateOfBirth == null ? null : LocalDate.parse(dateOfBirth));
        student.deriveAge(SEPTEMBER);
        return student;
    }

    @Test
    @DisplayName("age is counted in whole years on the reference date")
    void ageIsWholeYears() {
        assertEquals(7, ageOf("2019-01-10"));
        assertEquals(47, ageOf("1979-04-22"));
    }

    @Test
    @DisplayName("a birthday on the reference date has already happened; one the next day has not")
    void theBirthdayBoundary() {
        assertEquals(7, ageOf("2019-09-03"), "turns 7 today, so they are 7");
        assertEquals(6, ageOf("2019-09-04"), "not 7 until tomorrow");
    }

    @Test
    @DisplayName("a student with no date of birth simply has no age")
    void noDateOfBirthMeansNoAge() {
        Student student = bornOn(null);
        assertNull(student.getAgeInYears());
        assertFalse(student.hasDateOfBirth());
        assertFalse(student.hasAge());
    }

    @Test
    @DisplayName("a date of birth typed in the future leaves the age unknown rather than negative")
    void aFutureDateOfBirthIsNotANegativeAge() {
        Student student = bornOn("2027-01-01");
        assertTrue(student.hasDateOfBirth());
        assertNull(student.getAgeInYears(),
                "one mistyped year should not hand the solver a negative age");
    }

    @Test
    @DisplayName("re-deriving on a later date moves the age on")
    void ageFollowsTheReferenceDate() {
        Student student = bornOn("2019-01-10");
        assertEquals(7, student.getAgeInYears().intValue());

        student.deriveAge(SEPTEMBER.plusYears(1));
        assertEquals(8, student.getAgeInYears().intValue());
    }
}