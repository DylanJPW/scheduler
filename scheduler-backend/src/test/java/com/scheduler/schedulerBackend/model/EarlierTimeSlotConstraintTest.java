package com.scheduler.schedulerBackend.model;

import com.scheduler.schedulerBackend.config.SchedulingRules;
import com.scheduler.schedulerBackend.enums.Instrument;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.optaplanner.test.api.score.stream.ConstraintVerifier;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

class EarlierTimeSlotConstraintTest {

    private static final int SLOT_MINUTES = 30;

    private static final List<TimeSlot> EVENING = evening("18:00", 4);

    private final ConstraintVerifier<TimeTableConstraintProvider, TimeTable> constraintVerifier =
            ConstraintVerifier.build(new TimeTableConstraintProvider(), TimeTable.class,
                    Lesson.class, StudentAssignment.class);

    private final Teacher teacher = new Teacher("Teacher", List.of(Instrument.FIDDLE));
    private final Room room = new Room("room-1", "Room 1");

    private long nextId = 0;

    private static List<TimeSlot> evening(String firstStart, int slotCount) {
        List<TimeSlot> slots = new ArrayList<>(slotCount);
        LocalTime start = LocalTime.parse(firstStart);
        for (int i = 0; i < slotCount; i++) {
            slots.add(new TimeSlot(start, start.plusMinutes(SLOT_MINUTES)));
            start = start.plusMinutes(SLOT_MINUTES);
        }
        return slots;
    }

    /** A fully initialised class sitting in slot {@code slotIndex} (0-based) of the evening. */
    private Lesson lessonInSlot(int slotIndex) {
        Lesson lesson = new Lesson(nextId++, Instrument.FIDDLE);
        lesson.setTimeSlot(EVENING.get(slotIndex));
        lesson.setTeacher(teacher);
        lesson.setRoom(room);
        return lesson;
    }

    /** The lessons plus the evening's time slots, which the constraint counts against. */
    private Object[] withEvening(Lesson... lessons) {
        List<Object> facts = new ArrayList<>(EVENING);
        facts.addAll(List.of(lessons));
        return facts.toArray();
    }

    // ----------------------------------------------------------------- the rule

    @Test
    @DisplayName("a class in the first slot of the evening is free")
    void theFirstSlotCostsNothing() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::preferEarlierTimeSlots)
                .given(withEvening(lessonInSlot(0)))
                .penalizesBy(0);
    }

    @Test
    @DisplayName("a class is charged once per slot that starts before it")
    void thePenaltyIsTheSlotIndex() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::preferEarlierTimeSlots)
                .given(withEvening(lessonInSlot(2)))
                .penalizesBy(2);   // 18:00 and 18:30 both start before 19:00
    }

    @Test
    @DisplayName("the last slot of the evening is the dearest place to put a class")
    void theLastSlotIsTheDearest() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::preferEarlierTimeSlots)
                .given(withEvening(lessonInSlot(3)))
                .penalizesBy(3);
    }

    @Test
    @DisplayName("the charge is per class, so two late classes cost twice one")
    void thePenaltyIsPerClass() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::preferEarlierTimeSlots)
                .given(withEvening(lessonInSlot(1), lessonInSlot(1)))
                .penalizesBy(2);
    }

    @Test
    @DisplayName("filling the early slots beats spreading the same classes across the evening")
    void packingEarlyIsCheaperThanSpreading() {
        constraintVerifier.verifyThat(TimeTableConstraintProvider::preferEarlierTimeSlots)
                .given(withEvening(lessonInSlot(0), lessonInSlot(0)))
                .penalizesBy(0);

        constraintVerifier.verifyThat(TimeTableConstraintProvider::preferEarlierTimeSlots)
                .given(withEvening(lessonInSlot(0), lessonInSlot(3)))
                .penalizesBy(3);
    }

    @Test
    @DisplayName("classes still waiting on a teacher or a room are not counted at all")
    void uninitialisedLessonsAreIgnored() {
        Lesson halfPlaced = new Lesson(nextId++, Instrument.FIDDLE);
        halfPlaced.setTimeSlot(EVENING.get(3));   // late, but no teacher and no room yet

        constraintVerifier.verifyThat(TimeTableConstraintProvider::preferEarlierTimeSlots)
                .given(withEvening(halfPlaced))
                .penalizesBy(0);
    }

    // ------------------------------------------------------------- the ladder

    @Test
    @DisplayName("being early is the cheapest thing in the model, and bends to everything else")
    void earlinessIsTheLowestPriorityRule() {
        assertTrue(SchedulingRules.LATE_SLOT_PENALTY < SchedulingRules.PREFERRED_TIME_PENALTY,
                "someone's preferred time should outrank tidying the evening forward");
        assertTrue(SchedulingRules.PREFERRED_TIME_PENALTY < SchedulingRules.TEACHER_ROOM_PENALTY);
        assertTrue(SchedulingRules.TEACHER_ROOM_PENALTY < SchedulingRules.SIBLING_GAP_PENALTY);
        assertTrue(SchedulingRules.SIBLING_GAP_PENALTY < SchedulingRules.SMALL_CLASS_PENALTY);
    }
}