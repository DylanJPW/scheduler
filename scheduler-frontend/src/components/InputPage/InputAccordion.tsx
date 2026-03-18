import { useState } from "react";
import type { EntityId, ColDef, WithId } from "./types";
import { getTheme } from "../../utils";
import { useInputPage } from "./useInputPage";

interface InputAccordion<T> {
  label: string;
  initialItems: T[];
  colDefs: ColDef[];
}

export const InputAccordion = <T extends object & WithId>({
  label,
  initialItems,
  colDefs,
}: InputAccordion<T>) => {
  const { items, add, remove, edit } = useInputPage<T>(initialItems);
  const { dark, base, light } = getTheme(label);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const id = `${label}-accordion`;

  const [editableIds, setEditableIds] = useState<EntityId[]>([]);

  return (
    <div className="w-full">
      <input
        id={id}
        type="checkbox"
        checked={isOpen}
        className="peer sr-only"
      />
      <label
        htmlFor={id}
        className={`w-full flex justify-center items-center ${base} rounded-lg py-2 peer-checked:rounded-b-none`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {label} ( {isOpen ? "Close" : "Expand"} )
      </label>
      <div className="overflow-hidden h-fit max-h-0 rounded-b-lg peer-checked:max-h-75 peer-checked:overflow-auto transition-[max-height] duration-500 ease-in-out">
        <table className="w-full">
          <thead>
            <tr>
              {colDefs.map((col) => (
                <th
                  className={`sticky top-0 ${dark} text-start px-4 py-2`}
                  key={col.field}
                >
                  {col.name}
                </th>
              ))}
              <th
                className={`sticky top-0 ${dark} text-start px-4 py-2`}
                key={"Actions"}
              ></th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => {
              const isEditable = editableIds.includes(item.id);
              let currentItem = item;
              return (
                <tr className={light} key={item.id}>
                  {colDefs.map((col) => {
                    const field = col.field as keyof T;
                    const value = item[field];
                    const displayValue = Array.isArray(value)
                      ? value.join(", ")
                      : String(value ?? "Placeholder");

                    return (
                      <td
                        key={`${item.id}-${String(field)}`}
                        className="text-start px-2 py-2"
                      >
                        <input
                          defaultValue={displayValue}
                          readOnly={!isEditable}
                          className={`rounded-lg px-2 ${isEditable ? dark : ""} transition[background-color] duration-200`}
                          onChange={(e) =>
                            (currentItem = {
                              ...currentItem,
                              [field]: Array.isArray(value)
                                ? e.target.value.split(",").map((s) => s.trim())
                                : e.target.value,
                            })
                          }
                        />
                      </td>
                    );
                  })}
                  <td>
                    {isEditable ? (
                      <button
                        className="w-24 bg-blue-800 rounded-lg p-1 mx-4 hover:bg-blue-700 hover:cursor-pointer transition[background-color] duration-250"
                        onClick={() => {
                          setEditableIds((prev) =>
                            prev.filter((x) => x !== item.id),
                          );
                          edit(currentItem);
                        }}
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        className="w-24 bg-slate-800 rounded-lg p-1 mx-4 hover:bg-slate-700 hover:cursor-pointer transition[background-color] duration-250"
                        onClick={() =>
                          setEditableIds((prev) => [...prev, item.id])
                        }
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => remove(item.id)}
                      className="w-24 bg-red-800 rounded-lg p-1 hover:bg-red-700 hover:cursor-pointer transition[background-color] duration-250"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr className={light}>
              <td colSpan={colDefs.length}></td>
              <td>
                <button
                  className="w-24 bg-blue-800 rounded-lg mb-2 p-1 hover:bg-blue-700 hover:cursor-pointer transition[background-color] duration-250"
                  onClick={() => add()}
                >
                  Add
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
