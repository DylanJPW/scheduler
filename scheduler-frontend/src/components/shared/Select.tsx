import { useState } from "react";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string[];
  onChange: (value: string | string[]) => void;
  isMulti?: boolean;
}

export const Select = ({
  options,
  value,
  onChange,
  isMulti = false,
}: SelectProps) => {
  const [open, setOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (isMulti) {
      if (value.includes(option)) {
        onChange(value.filter((v) => v !== option));
      } else {
        onChange([...value, option]);
      }
    } else {
      onChange(option);
    }
  };

  const displayValue =
    value?.length === 0
      ? "Select options"
      : options
          .filter((opt) => value.includes(opt.value))
          .map((opt) => opt.label)
          .join(", ");

  return (
    <>
      <div
        className="border p-2 rounded cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {displayValue}
      </div>

      {open && (
        <>
          <div
            className="h-screen w-screen bg-black opacity-0 block fixed z-40 top-0 left-0"
            onClick={() => setOpen(false)}
          ></div>
          <div className=" border mt-1 bg-slate-700 rounded shadow z-50">
            {options.map((opt) => {
              return (
                <label key={opt.value} className="flex items-center gap-2 p-2">
                  <input
                    type="checkbox"
                    checked={value.includes(opt.value)}
                    onChange={() => toggleOption(opt.value)}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </>
      )}
    </>
  );
};
