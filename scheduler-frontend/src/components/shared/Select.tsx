import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { KeyValue } from "../InputPage/types";

interface SelectProps {
  options: KeyValue[];
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
  const triggerRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

  const handleScroll = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();

    setMenuPos({
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
    if (open) {
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

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
          .filter((opt) => value.includes(opt.key))
          .map((opt) => opt.value)
          .join(", ");

  const upArrow = <>&#9206;</>;
  const downArrow = <>&#9207;</>;

  return (
    <>
      <div
        ref={triggerRef}
        className="border-2 px-1 rounded cursor-pointer flex justify-between"
        onClick={() => setOpen(!open)}
      >
        <p>{displayValue}</p>
        <p>{open ? upArrow : downArrow}</p>
      </div>

      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div
              className="fixed z-50 bg-slate-700 border rounded shadow"
              style={{
                top: menuPos.top,
                left: menuPos.left,
                width: menuPos.width,
              }}
            >
              {options.map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center gap-2 p-2 cursor-pointer hover:bg-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(opt.key)}
                    onChange={() => toggleOption(opt.key)}
                  />
                  {opt.value}
                </label>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
};
