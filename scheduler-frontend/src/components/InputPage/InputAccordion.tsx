import { useEffect, useState } from "react";
import {
  InputType,
  type EntityId,
  type ColDef,
  type WithId,
  type KeyValue,
} from "./types";
import { getTheme } from "../../utils";
import { useInputAccordion } from "./useInputAccordion";
import { Select } from "../shared/Select";
import type { TimeSlot } from "../../types";

interface InputAccordion<T> {
  label: string;
  initialItems: T[];
  colDefs: ColDef[];
  setPayloadItems: (value: T[]) => void;
}

type DisplayValueType = string | string[] | TimeSlot;

interface RenderInputProps<T> {
  value: DisplayValueType;
  isEditable: boolean;
  item: T;
  field: keyof T;
  type?: InputType;
  options?: KeyValue[];
}

function getDisplayValue(
  value: DisplayValueType,
  type: InputType = "text",
  options: KeyValue[] = [],
) {
  if (type === InputType.multiSelect) {
    return (value as string[])
      .map((v) => options.find((o) => o.key === v)?.value ?? v)
      .join(", ");
  }
  if (type === InputType.timeRange) {
    return (value as TimeSlot)?.startTime && (value as TimeSlot)?.endTime
      ? `${(value as TimeSlot)?.startTime} — ${(value as TimeSlot)?.endTime}`
      : "No preference";
  }
  return options.find((o) => o.key === value)?.value ?? value;
}

export const InputAccordion = <T extends object & WithId>({
  label,
  initialItems,
  colDefs,
  setPayloadItems,
}: InputAccordion<T>) => {
  const { items, add, remove, edit } = useInputAccordion<T>(initialItems);
  const { dark, base, light } = getTheme(label);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const id = `${label}-accordion`;

  const [editableIds, setEditableIds] = useState<EntityId[]>([]);

  useEffect(() => {
    setPayloadItems(items);
  }, [items]);

  const renderInput = ({
    item,
    field,
    value,
    isEditable,
    type,
    options,
  }: RenderInputProps<T>) => {
    if (!isEditable) {
      return (
        <input
          readOnly={true}
          value={getDisplayValue(value, type, options) as string}
          className="rounded-lg px-2 py-0.5 transition[background-color] duration-200"
        />
      );
    }

    if (type === InputType.select && options) {
      return (
        <Select
          options={options}
          value={[value as string]}
          onChange={(val) => edit({ ...item, [field]: val })}
        />
      );
    }

    if (type === InputType.multiSelect && options) {
      return (
        <Select
          options={options}
          value={value as string[]}
          isMulti
          onChange={(val) => edit({ ...item, [field]: val })}
        />
      );
    }

    if (type === InputType.timeRange && field === "preferredTimeRange") {
      return (
        <div className="flex flex-row">
          <input
            className={`rounded-lg px-2 py-0.5 ${dark}`}
            type="time"
            value={(value as TimeSlot)?.startTime}
            onChange={(e) =>
              edit({
                ...item,
                preferredTimeRange: {
                  ...(value as TimeSlot),
                  startTime: e.target.value,
                },
              })
            }
          />
          <p className="px-2">—</p>
          <input
            className={`rounded-lg px-2 py-0.5 ${dark}`}
            type="time"
            value={(value as TimeSlot)?.endTime}
            onChange={(e) =>
              edit({
                ...item,
                preferredTimeRange: {
                  ...(value as TimeSlot),
                  endTime: e.target.value,
                },
              })
            }
          />
        </div>
      );
    }

    return (
      <input
        value={value as string}
        className={`rounded-lg px-2 ${dark}`}
        onChange={(e) =>
          edit({
            ...item,
            [field]: e.target.value,
          })
        }
      />
    );
  };

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
      <div
        className="overflow-hidden h-fit max-h-0 rounded-b-lg 
        peer-checked:max-h-75 peer-checked:overflow-auto transition-[max-height] duration-500 ease-in-out 
        [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-track]:bg-neutral-700 [&::-webkit-scrollbar-track]:rounded-lg
      [&::-webkit-scrollbar-thumb]:bg-neutral-500 [&::-webkit-scrollbar-thumb]:rounded-lg"
      >
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
              return (
                <tr className={light} key={item.id}>
                  {colDefs.map((col) => {
                    const { type, options } = col;
                    const field = col.field as keyof T;
                    const value =
                      type === InputType.timeRange
                        ? (item[field] as TimeSlot)
                        : (item[field] as string | string[]);

                    return (
                      <td
                        key={`${item.id}-${String(field)}`}
                        className="text-start px-2 py-2"
                      >
                        {renderInput({
                          item,
                          field,
                          value,
                          isEditable,
                          type,
                          options,
                        })}
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
                  onClick={() => {
                    const newItem = add();
                    setEditableIds((prev) => [...prev, newItem.id]);
                  }}
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
