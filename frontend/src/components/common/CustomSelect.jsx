
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function CustomSelect({
  value,
  options = [],
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const selectedOption = options.find(
    (option) => option.value === value
  );

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();

      setPosition({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current?.contains(event.target) ||
        event.target.closest?.(".luminest-select-menu")
      ) {
        return;
      }

      setOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div
      className={`luminest-select ${className}`}
      ref={containerRef}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`luminest-select-trigger ${
          open ? "is-open" : ""
        }`}
        onClick={() => setOpen((previous) => !previous)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selectedOption?.label || placeholder}</span>

        <span
          className={`luminest-select-arrow ${
            open ? "rotated" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {open && position &&
        createPortal(
          <div
            className="luminest-select-menu"
            role="listbox"
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: position.width,
              zIndex: 99999,
            }}
          >
            {options.map((option) => (
              <button
                type="button"
                key={option.value}
                className={`luminest-select-option ${
                  option.value === value ? "selected" : ""
                }`}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={option.value === value}
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
