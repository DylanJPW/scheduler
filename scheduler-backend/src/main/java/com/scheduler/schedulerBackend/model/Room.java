package com.scheduler.schedulerBackend.model;

import java.util.Locale;
import java.util.Objects;

public class Room {

    private String id;
    private String name;

    public Room() {
    }

    public Room(String id, String name) {
        setId(id);
        this.name = name;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = (id == null || id.isBlank()) ? null : id.trim().toLowerCase(Locale.ROOT);
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getKey() {
        if (id != null) {
            return id;
        }
        return (name == null || name.isBlank()) ? null : name.trim().toLowerCase(Locale.ROOT);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Room other)) {
            return false;
        }
        String key = getKey();
        if (key == null || other.getKey() == null) {
            return false;
        }
        return key.equals(other.getKey());
    }

    @Override
    public int hashCode() {
        String key = getKey();
        return key == null ? System.identityHashCode(this) : Objects.hash(key);
    }

    @Override
    public String toString() {
        return (name == null || name.isBlank()) ? String.valueOf(id) : name;
    }
}