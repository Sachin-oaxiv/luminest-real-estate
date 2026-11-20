
const INTEREST_OPTIONS = [
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "thinking", label: "Thinking" },
  { value: "callback_requested", label: "Callback Requested" },
];

export default function InterestStatusSelect({
  value = "thinking",
  onChange,
  disabled = false,
  className = "",
}) {
  return (
    <select
      className={className}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      disabled={disabled}
      aria-label="Customer interest status"
    >
      {INTEREST_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
