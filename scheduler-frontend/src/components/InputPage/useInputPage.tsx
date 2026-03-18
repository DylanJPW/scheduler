import { useState } from "react";
import type { EntityId, WithId } from "./types";

const requestURL = "api/timeTable";

export function useInputPage<T extends WithId>(initialItems: T[]) {
  const [items, setItems] = useState<T[]>(initialItems);

  const add = () => {
    const item = {
      id: crypto.randomUUID(), // blank object with temp frontend id
    } as T;
    setItems((prev) => [...prev, item]);
  };

  const remove = (id: EntityId) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    console.log("Test items:", items);
  };

  const edit = (newItem: T) => {
    setItems((prev) => prev.map((x) => (newItem.id === x.id ? newItem : x)));
  };

  return {
    items,
    add,
    remove,
    edit,
  };
}
