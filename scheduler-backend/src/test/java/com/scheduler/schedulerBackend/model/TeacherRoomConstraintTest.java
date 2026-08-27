package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.config.SchedulingRules;
import com.scheduler.schedulerBackend.enums.Instrument;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.optaplanner.test.api.score.stream.ConstraintVerifier;

import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * A note on what penalizesBy() asserts, because it is not what it looks like: it is the sum of the
 * MATCH WEIGHTS, not the resulting score. This constraint penalises a flat ONE per class with a
 * constraint weight of TEACHER_ROOM_PENALTY, so one class in the wrong room is penalizesBy(1) and
 * scores -3soft. Asserting 3 here fails with "expected 3, actual 1" even though the constraint is
 * perfectly correct - which is exactly how these tests failed the first time they were run.
 *
 * The weights themselves are asserted separately, in familiesOutrankRooms().
 */
class TeacherRoomConstraintTest {

    private static final int SLOT_MINUTES = 30;

    private final ConstraintVerifier<TimeTableConstraintProvider, TimeTable> constraintVerifier =
            ConstraintVerifier.build(new TimeTableConstraintProvider(), TimeTable.class,
                    Lesson.class, StudentAssignment.class);

    private final Room roomOne = new Room("room-1", "Room 1");
    private final Room kitchen = new Room("kitchen", "Kitchen");

    private long nextId = 0;

    private Teacher teacher(String preferredRoomId) {
        return new Teacher("Teacher", List.of(Instrument.FIDDLE), preferredRoomId);
    }

    private Lesson lesson(String start, Teacher teacher, Room room) {
        LocalTime startTime = LocalTime.parse(start);
        Lesson lesson = new Lesson(nextId++, Instrument.FIDDLE);
        lesson.setTimeSlot(new TimeSlot(startTime, startTime.plusMinutes(SLOT_MINUTES)));
        lesson.setTeacher(teacher);
        lesson.setRoom(room);
        return lesson;
    }

    // ----------------------------------------------------------------- the rule

    @Test
    @DisplayName("a teacher in the room they asked for costs nothing")
    void preferredRoomIsFree() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::teacherOutsidePreferredRoom)
                .given(lesson("18:00", teacher("room-1"), roomOne))
                .penalizesBy(0);
    }

    @Test
    @DisplayName("a teacher moved elsewhere is penalised once for that class")
    void wrongRoomIsPenalised() {
        Teacher wantsRoomOne = teacher("room-1");
        constraintVerifier.verifyThat(TimeTableConstraintProvider::teacherOutsidePreferredRoom)
                .given(lesson("18:00", wantsRoomOne, kitchen))
                .penalizesBy(1);   // one match, which the constraint weight turns into -3soft
    }

    @Test
    @DisplayName("two classes in the wrong room cost twice as much as one")
    void thePenaltyIsPerClass() {
        Teacher wantsRoomOne = teacher("room-1");
        constraintVerifier.verifyThat(TimeTableConstraintProvider::teacherOutsidePreferredRoom)
                .given(lesson("18:00", wantsRoomOne, kitchen), lesson("18:30", wantsRoomOne, kitchen))
                .penalizesBy(2);   // two matches: the rule bills per class, not per teacher
    }

    @Test
    @DisplayName("a teacher with no preference can be put anywhere, for free")
    void noPreferenceIsNeverPenalised() {
        Teacher easyGoing = teacher(null);
        constraintVerifier.verifyThat(TimeTableConstraintProvider::teacherOutsidePreferredRoom)
                .given(lesson("18:00", easyGoing, roomOne), lesson("18:30", easyGoing, kitchen))
                .penalizesBy(0);
    }

    @Test
    @DisplayName("a blank room box is the same as no preference, not a room called \"\"")
    void blankPreferenceIsNoPreference() {
        Teacher blank = teacher("   ");
        assertNull(blank.getPreferredRoomId());
        assertFalse(blank.hasPreferredRoom());
        constraintVerifier.verifyThat(TimeTableConstraintProvider::teacherOutsidePreferredRoom)
                .given(lesson("18:00", blank, kitchen))
                .penalizesBy(0);
    }

    @Test
    @DisplayName("the preference matches the room's key, whatever case it was typed in")
    void preferenceMatchingIsCaseInsensitive() {
        assertEquals("kitchen", teacher(" KITCHEN ").getPreferredRoomId());
        constraintVerifier.verifyThat(TimeTableConstraintProvider::teacherOutsidePreferredRoom)
                .given(lesson("18:00", teacher(" KITCHEN "), kitchen))
                .penalizesBy(0);
    }

    @Test
    @DisplayName("a preference naming a room that does not exist just costs, it does not blow up")
    void preferenceForAMissingRoomIsMerelyUnmet() {
        assertTrue(teacher("the-shed").hasPreferredRoom());
        constraintVerifier.verifyThat(TimeTableConstraintProvider::teacherOutsidePreferredRoom)
                .given(lesson("18:00", teacher("the-shed"), roomOne))
                .penalizesBy(1);
    }

    @Test
    @DisplayName("a family split apart outweighs a teacher moved room, by design")
    void familiesOutrankRooms() {
        assertTrue(SchedulingRules.SIBLING_GAP_PENALTY > SchedulingRules.TEACHER_ROOM_PENALTY,
                "moving a teacher should be the cheaper compromise");
    }
}
