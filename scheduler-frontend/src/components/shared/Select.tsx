import { useEffect, useState } from "react";

interface SelectProps {
  options: string[];
  defaultSelected: string | string[];
  onChange: (value: string | string[]) => void;
  isMulti?: boolean;
}

export const Select = ({
  options,
  defaultSelected,
  onChange,
  isMulti = false,
}: SelectProps) => {
  const [selected, setSelected] = useState<string | string[]>(defaultSelected);
  const [open, setOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (isMulti) {
      setSelected((prev) =>
        (prev as string[]).includes(option)
          ? (prev as string[]).filter((o) => o !== option)
          : [...prev, option],
      );
    } else {
      setSelected([option]);
    }
  };

  useEffect(() => {
    onChange(selected);
  }, [selected]);

  let displayValue = "";
  if (!selected.length) {
    displayValue = "Select options";
  } else {
    displayValue = Array.isArray(selected) ? selected.join(", ") : selected;
  }

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
          <div className="absolute border mt-1 bg-slate-700 rounded shadow z-50">
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 p-2">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </>
      )}
    </>
  );
};
