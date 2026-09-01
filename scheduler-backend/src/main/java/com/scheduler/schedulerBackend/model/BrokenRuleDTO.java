package com.scheduler.schedulerBackend.model;

import org.optaplanner.core.api.score.buildin.hardsoft.HardSoftScore;
import org.optaplanner.core.api.score.constraint.ConstraintMatch;
import org.optaplanner.core.api.score.constraint.ConstraintMatchTotal;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.IntFunction;

/**
 * One constraint's contribution to the score, in words the person reading the timetable can use.
 */
public class BrokenRuleDTO {

    /** Beyond this many, "show me" stops being a useful thing to click. */
    private static final int MAX_LESSON_IDS = 40;
    private static final int MAX_PERSON_KEYS = 200;

    /** Who a rule is actually about, which is not the same as who its matches happen to mention. */
    enum Blames { NOBODY, STUDENTS, TEACHER }

    private record Rule(IntFunction<String> phrasing, Blames blames) {}

    private String constraintName;
    private String description;
    private String scoreImpact;
    private List<Long> lessonIds;
    private List<String> studentKeys;
    private List<String> teacherKeys;

    public BrokenRuleDTO() {
    }

    public BrokenRuleDTO(String constraintName, String description, String scoreImpact,
                         List<Long> lessonIds, List<String> studentKeys, List<String> teacherKeys) {
        this.constraintName = constraintName;
        this.description = description;
        this.scoreImpact = scoreImpact;
        this.lessonIds = lessonIds;
        this.studentKeys = studentKeys;
        this.teacherKeys = teacherKeys;
    }

    public static BrokenRuleDTO from(ConstraintMatchTotal<HardSoftScore> total) {
        String name = total.getConstraintName();
        Set<ConstraintMatch<HardSoftScore>> matches = total.getConstraintMatchSet();
        Blames blames = blamesFor(name);
        return new BrokenRuleDTO(
                name,
                describe(name, total.getConstraintMatchCount()),
                total.getScore().toString(),
                lessonIdsOf(matches),
                blames == Blames.STUDENTS ? studentKeysOf(matches) : List.of(),
                blames == Blames.TEACHER ? teacherKeysOf(matches) : List.of());
    }

    /*
     * Two things this table is carrying.
     *
     * The sentence. getConstraintMatchCount() counts TUPLES in the constraint stream, which is a
     * count of real things only when the last join lines up one-to-one with a real thing. Most of
     * ours do: one match per clash, per oversized class, per sibling pair. Two do not.
     * "Prefer Earlier Time Slots" makes one tuple per (class, earlier slot) and "Young Students
     * Scheduled Late" one per (student, earlier slot), so those counts are amounts of lateness,
     * not numbers of classes or students, and they are phrased in their own units.
     *
     * And who is at fault. A match indicts everything its stream selected, so a rule about packing
     * the evening still mentions a teacher - it had to join the class to find the time. Marking
     * that rule NOBODY stops nine blameless teachers lighting up under "the evening could be
     * tighter". Rules that blame a teacher reach them through the class, because those streams
     * select Lesson rather than Teacher; that is fine, because there the teacher really is the
     * subject.
     */
    private static final Map<String, Rule> RULES = Map.ofEntries(
            Map.entry("Teacher Conflict", new Rule(
                    n -> count(n, "clash", "clashes") + " where a teacher is in two places at once",
                    Blames.TEACHER)),
            Map.entry("Room Conflict", new Rule(
                    n -> count(n, "clash", "clashes") + " where two classes share a room",
                    Blames.NOBODY)),
            Map.entry("Teacher Lacks Instrument", new Rule(
                    n -> count(n, "class is", "classes are") + " with a teacher who does not play the instrument",
                    Blames.TEACHER)),
            Map.entry("Max Students Per Lesson", new Rule(
                    n -> count(n, "class is", "classes are") + " over the size limit",
                    Blames.NOBODY)),
            Map.entry("Student Has Wrong Instrument", new Rule(
                    n -> count(n, "student is", "students are") + " in a class for the wrong instrument",
                    Blames.STUDENTS)),
            Map.entry("Class Too Small", new Rule(
                    n -> count(n, "class is", "classes are") + " below the smallest workable size",
                    Blames.NOBODY)),
            Map.entry("Empty Class", new Rule(
                    n -> count(n, "class has", "classes have") + " nobody in it",
                    Blames.NOBODY)),
            Map.entry("Student Does Not Prefer Time", new Rule(
                    n -> count(n, "student is", "students are") + " outside the time they asked for",
                    Blames.STUDENTS)),
            Map.entry("Teacher Does Not Prefer Time", new Rule(
                    n -> count(n, "class is", "classes are") + " outside the teacher's preferred time",
                    Blames.TEACHER)),
            Map.entry("Teacher Outside Preferred Room", new Rule(
                    n -> count(n, "class is", "classes are") + " not in the teacher's usual room",
                    Blames.TEACHER)),
            Map.entry("Siblings Scheduled Apart", new Rule(
                    n -> count(n, "pair", "pairs") + " of siblings are not close together in the evening",
                    Blames.STUDENTS)),
            Map.entry("Young Students Scheduled Late", new Rule(
                    n -> "younger students are later in the evening than their age suggests ("
                            + n + " student-slots of lateness)",
                    Blames.STUDENTS)),
            Map.entry("Prefer Earlier Time Slots", new Rule(
                    n -> "classes could sit closer to the front of the evening (" + n + " slot-steps)",
                    Blames.NOBODY)));

    /**
     * A sentence for one constraint. An unknown name falls back to the name itself rather than
     * throwing, so adding a constraint and forgetting an entry here degrades to something ugly but
     * honest instead of a 500. BrokenRuleDTOTest fails if you forget.
     */
    static String describe(String constraintName, int matchCount) {
        Rule rule = RULES.get(constraintName);
        return rule == null
                ? constraintName + " (" + matchCount + ")"
                : rule.phrasing().apply(matchCount);
    }

    /** An unknown constraint blames nobody, so a forgotten entry never mislabels a person. */
    static Blames blamesFor(String constraintName) {
        Rule rule = RULES.get(constraintName);
        return rule == null ? Blames.NOBODY : rule.blames();
    }

    static boolean hasDescription(String constraintName) {
        return RULES.containsKey(constraintName);
    }

    static int ruleCount() {
        return RULES.size();
    }

    /**
     * Which classes to light up in the grid. A match's indicted objects are the facts and entities
     * its stream selected, so a Lesson is either in there directly or reachable off a
     * StudentAssignment.
     */
    static List<Long> lessonIdsOf(Set<ConstraintMatch<HardSoftScore>> matches) {
        Set<Long> ids = new LinkedHashSet<>();
        for (ConstraintMatch<HardSoftScore> match : matches) {
            for (Object indicted : match.getIndictedObjectList()) {
                Lesson lesson = null;
                if (indicted instanceof Lesson candidate) {
                    lesson = candidate;
                } else if (indicted instanceof StudentAssignment assignment) {
                    lesson = assignment.getLesson();
                }
                if (lesson != null && lesson.getId() != null) {
                    ids.add(lesson.getId());
                }
            }
            if (ids.size() >= MAX_LESSON_IDS) {
                break;
            }
        }
        return List.copyOf(ids);
    }

    /** The students a rule names, by {@link Person#getKey()}. */
    static List<String> studentKeysOf(Set<ConstraintMatch<HardSoftScore>> matches) {
        Set<String> keys = new LinkedHashSet<>();
        for (ConstraintMatch<HardSoftScore> match : matches) {
            for (Object indicted : match.getIndictedObjectList()) {
                Student student = null;
                if (indicted instanceof Student candidate) {
                    student = candidate;
                } else if (indicted instanceof StudentAssignment assignment) {
                    student = assignment.getStudent();
                }
                if (student != null) {
                    keys.add(student.getKey());
                }
            }
            if (keys.size() >= MAX_PERSON_KEYS) {
                break;
            }
        }
        return List.copyOf(keys);
    }

    /** The teachers a rule names, reached either directly or off the class they are teaching. */
    static List<String> teacherKeysOf(Set<ConstraintMatch<HardSoftScore>> matches) {
        Set<String> keys = new LinkedHashSet<>();
        for (ConstraintMatch<HardSoftScore> match : matches) {
            for (Object indicted : match.getIndictedObjectList()) {
                Teacher teacher = null;
                if (indicted instanceof Teacher candidate) {
                    teacher = candidate;
                } else if (indicted instanceof Lesson lesson) {
                    teacher = lesson.getTeacher();
                }
                if (teacher != null) {
                    keys.add(teacher.getKey());
                }
            }
            if (keys.size() >= MAX_PERSON_KEYS) {
                break;
            }
        }
        return List.copyOf(keys);
    }

    private static String count(int n, String one, String many) {
        return n + " " + (n == 1 ? one : many);
    }

    public String getConstraintName() {
        return constraintName;
    }

    public String getDescription() {
        return description;
    }

    public String getScoreImpact() {
        return scoreImpact;
    }

    public List<Long> getLessonIds() {
        return lessonIds;
    }

    public List<String> getStudentKeys() {
        return studentKeys;
    }

    public List<String> getTeacherKeys() {
        return teacherKeys;
    }
}
