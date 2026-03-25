import { useEffect, useState } from "react";
import {
  type EntityId,
  type ColDef,
  type WithId,
  type InputType,
  InputSelectType,
} from "./types";
import { getTheme } from "../../utils";
import { useInputAccordion } from "./useInputAccordion";
import { Instrument } from "../../types";
import { Select } from "../shared/Select";

interface InputAccordion<T> {
  label: string;
  initialItems: T[];
  colDefs: ColDef[];
  setPayloadItems: (value: T[]) => void;
}

interface RenderInputProps<T> {
  value: string | string[];
  isEditable: boolean;
  item: T;
  field: keyof T;
  type?: InputType;
}

function getDisplayValue(value: string | Instrument[]) {
  if (Array.isArray(value)) {
    return value.map((v) => Instrument[v] ?? v).join(", ");
  }
  return Instrument[value as Instrument] ?? value;
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
  }: RenderInputProps<T>) => {
    if (!isEditable) {
      return (
        <input
          readOnly={true}
          value={getDisplayValue(value as string)}
          className={`rounded-lg px-2 py-0.5 ${isEditable ? dark : ""} transition[background-color] duration-200`}
        />
      );
    }

    const options = Object.entries(Instrument).map(([key, label]) => ({
      label,
      value: key,
    }));
    if (type === InputSelectType.select) {
      return (
        <Select
          options={options}
          value={[value as string]}
          onChange={(val) => edit({ ...item, [field]: val })}
        />
      );
    }

    if (type === InputSelectType.multiSelect) {
      return (
        <Select
          options={options}
          value={value as string[]}
          isMulti
          onChange={(val) => edit({ ...item, [field]: val })}
        />
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
                    const type = col.type;
                    const field = col.field as keyof T;
                    const value = item[field] as string | string[];

                    return (
                      <td
                        key={`${item.id}-${String(field)}`}
                        className="text-start px-2 py-2"
                      >
                        {renderInput({ item, field, value, isEditable, type })}
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
