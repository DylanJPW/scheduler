import { useState } from "react";
import { COL_NAMES } from "./types";
import { getTheme } from "../../utils";

interface InputAccordion<T> {
  label: string;
  data: T[];
}

export const InputAccordion = <T extends Record<string, unknown>>({
  label,
  data,
}: InputAccordion<T>) => {
  const [isOpen, setIsOpen] = useState<boolean>();

  const dataFields = Object.keys(data[0]) as (keyof typeof COL_NAMES)[];

  const { dark, base, light } = getTheme(label);

  return (
    <div className="w-full">
      <input
        id="expandCollapse"
        type="checkbox"
        checked={isOpen}
        className="peer sr-only"
      />
      <label
        htmlFor="expandCollapse"
        className={`w-full flex justify-center items-center ${base} rounded-lg py-2 peer-checked:rounded-b-none`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {label} ( {isOpen ? "Close" : "Expand"} )
      </label>
      <div className="overflow-hidden h-fit max-h-0 rounded-b-lg peer-checked:max-h-75 peer-checked:overflow-auto transition-[max-height] duration-500 ease-in-out">
        <table className="w-full">
          <thead>
            <tr className={`${dark}`}>
              {dataFields.map((field) => (
                <th key={field}>{COL_NAMES[field]}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((element) => (
              <tr className={`${light}`}>
                {Object.values(element).map((value, i) => (
                  <td key={i}>
                    {Array.isArray(value)
                      ? value.join(", ")
                      : (value as string)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
