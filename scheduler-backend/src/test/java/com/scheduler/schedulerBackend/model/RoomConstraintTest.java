package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.enums.Instrument;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.optaplanner.test.api.score.stream.ConstraintVerifier;

import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

class RoomConstraintTest {

    private static final int SLOT_MINUTES = 30;

    private final ConstraintVerifier<TimeTableConstraintProvider, TimeTable> constraintVerifier =
            ConstraintVerifier.build(new TimeTableConstraintProvider(), TimeTable.class,
                    Lesson.class, StudentAssignment.class);

    private final Room roomOne = new Room("room-1", "Room 1");
    private final Room kitchen = new Room("kitchen", "Kitchen");

    private long nextId = 0;

    private Lesson lesson(String start, Room room) {
        LocalTime startTime = LocalTime.parse(start);
        Lesson lesson = new Lesson(nextId++, Instrument.FIDDLE);
        lesson.setTimeSlot(new TimeSlot(startTime, startTime.plusMinutes(SLOT_MINUTES)));
        lesson.setTeacher(new Teacher("Máire", List.of(Instrument.FIDDLE)));
        lesson.setRoom(room);
        return lesson;
    }

    // ------------------------------------------------------------ the rule itself

    @Test
    @DisplayName("two classes in the same room at the same time is one hard penalty")
    void sameRoomSameTimeClashes() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::roomConflict)
                .given(lesson("18:00", roomOne), lesson("18:00", roomOne))
                .penalizesBy(1);
    }

    @Test
    @DisplayName("the same room at different times is fine")
    void sameRoomDifferentTimesIsFree() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::roomConflict)
                .given(lesson("18:00", roomOne), lesson("18:30", roomOne))
                .penalizesBy(0);
    }

    @Test
    @DisplayName("different rooms at the same time is the whole point")
    void differentRoomsSameTimeIsFree() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::roomConflict)
                .given(lesson("18:00", roomOne), lesson("18:00", kitchen))
                .penalizesBy(0);
    }

    @Test
    @DisplayName("three classes crammed into one room at once is three clashing pairs")
    void threeInOneRoomCountsEveryPair() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::roomConflict)
                .given(lesson("18:00", roomOne), lesson("18:00", roomOne), lesson("18:00", roomOne))
                .penalizesBy(3);
    }

    @Test
    @DisplayName("a room limit falls out of this: four rooms cannot hold five classes at once")
    void theRoomListIsTheConcurrencyLimit() {
        List<Room> fourRooms = List.of(
                new Room("a", "Room 1"), new Room("b", "Room 2"),
                new Room("c", "Upstairs"), new Room("d", "Kitchen"));

        Lesson[] lessons = new Lesson[5];
        for (int i = 0; i < 5; i++) {
            lessons[i] = lesson("18:00", fourRooms.get(i % fourRooms.size()));
        }

        constraintVerifier.verifyThat(TimeTableConstraintProvider::roomConflict)
                .given((Object[]) lessons)
                .penalizesBy(1);
    }

    // ------------------------------------------------- what identity means for a room

    @Test
    @DisplayName("rooms are the same room when their ids match, whatever they are called")
    void roomsMatchOnId() {
        assertEquals(new Room("kitchen", "Kitchen"), new Room("KITCHEN", "The kitchen"));
    }

    @Test
    @DisplayName("a room with no id falls back to its name")
    void roomsWithoutIdsMatchOnName() {
        assertEquals(new Room(null, "Kitchen"), new Room("", " kitchen "));
        assertNotEquals(new Room(null, "Kitchen"), new Room(null, "Upstairs"));
    }

    @Test
    @DisplayName("two rooms with nothing to tell them apart stay separate rooms")
    void anonymousRoomsAreNotMerged() {
        assertNotEquals(new Room(null, null), new Room(null, null));
    }
}