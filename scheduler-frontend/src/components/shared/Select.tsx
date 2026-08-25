import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { KeyValue } from "../InputPage/types";

interface MultiSelectProps {
  options: KeyValue[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label: string;
}

export const Select = ({
  options,
  value,
  onChange,
  placeholder = "Select…",
  label,
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setMenuPos({ top: rect.bottom, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;

    reposition();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, reposition]);

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const selected = options.filter((opt) => value.includes(opt.key));
  const displayValue =
    selected.length === 0 ? placeholder : selected.map((o) => o.value).join(", ");

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${displayValue}`}
        className="w-full border-2 border-slate-400 px-1 rounded cursor-pointer flex justify-between items-center gap-2 text-left focus:outline-2 focus:outline-blue-300"
        onClick={() => setOpen(!open)}
      >
        <span className={selected.length === 0 ? "opacity-60" : undefined}>
          {displayValue}
        </span>
        <span aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>

      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div
              role="listbox"
              aria-label={label}
              aria-multiselectable="true"
              className="fixed z-50 bg-slate-700 border border-slate-400 rounded shadow max-h-72 overflow-auto"
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