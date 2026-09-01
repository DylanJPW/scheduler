import type { EntityId, Person } from "../../types";

export function nameKey(name: string | undefined | null): string {
  return (name ?? "").trim().toLowerCase();
}

export function hasId(id: EntityId | undefined | null): id is EntityId {
  return id !== undefined && id !== null && id !== "";
}

type Keyable = { key?: string; id?: EntityId; name?: string };

export function personKey(person: Keyable | undefined | null): string {
  if (!person) return "";
  if (person.key) return person.key;
  if (hasId(person.id)) return String(person.id).trim();
  return nameKey(person.name);
}

export function isIdentified(person: Keyable | undefined | null): boolean {
  if (!person) return false;
  return Boolean(person.key) || hasId(person.id);
}

export function findPerson<T>(
  candidate: Person | undefined | null,
  byKey: Map<string, T>,
  byName: Map<string, T>,
): T | undefined {
  if (!candidate) return undefined;
  const hit = byKey.get(personKey(candidate));
  if (hit) return hit;
  return byName.get(nameKey(candidate.name));
}

export function roomKey(
  room: { id?: EntityId; name?: string } | undefined | null,
): string {
  if (!room) return "";
  const id = hasId(room.id) ? String(room.id).trim().toLowerCase() : "";
  return id || nameKey(room.name);
}