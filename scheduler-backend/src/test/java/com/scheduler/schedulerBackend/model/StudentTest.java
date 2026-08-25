package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.enums.Instrument;
import com.scheduler.schedulerBackend.enums.SkillLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

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
}