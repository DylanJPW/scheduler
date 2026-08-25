import type { EntityId, Person } from "../../types";

export function nameKey(name: string | undefined | null): string {
  return (name ?? "").trim().toLowerCase();
}

export function hasId(id: EntityId | undefined | null): id is EntityId {
  return id !== undefined && id !== null && id !== "";
}

export function findPerson<T>(
  candidate: Person | undefined | null,
  byId: Map<EntityId, T>,
  byName: Map<string, T>,
): T | undefined {
  if (!candidate) return undefined;
  if (hasId(candidate.id)) {
    const hit = byId.get(candidate.id);
    if (hit) return hit;
  }
  return byName.get(nameKey(candidate.name));
}