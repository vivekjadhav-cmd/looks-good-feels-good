"use client";

interface ChipGroupProps {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  variant?: "warm" | "blush" | "sage";
  multi?: boolean;
}

export default function ChipGroup({
  options,
  selected,
  onToggle,
  variant = "warm",
  multi = false,
}: ChipGroupProps) {
  const handleClick = (value: string) => {
    if (!multi && selected.includes(value)) return;
    onToggle(value);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => handleClick(option)}
            className={`chip-${variant} ${isActive ? "chip-active" : ""}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
