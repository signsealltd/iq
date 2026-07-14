"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Appearance = "dark" | "light" | "system";

const options: { value: Appearance; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor }
];

function applyAppearance(value: Appearance) {
  const resolved = value === "system" && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}

export function AppearanceToggle() {
  const [appearance, setAppearance] = useState<Appearance>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("signseal-iq-appearance") as Appearance | null) ?? "dark";
    setAppearance(stored);
    applyAppearance(stored);
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const listener = () => {
      if ((localStorage.getItem("signseal-iq-appearance") ?? "dark") === "system") applyAppearance("system");
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return (
    <div className="grid grid-cols-3 rounded-lg border border-line bg-page p-1" aria-label="Appearance">
      {options.map(({ value, label, icon: Icon }) => {
        const active = appearance === value;
        return (
          <button
            key={value}
            type="button"
            title={label}
            aria-pressed={active}
            onClick={() => {
              localStorage.setItem("signseal-iq-appearance", value);
              setAppearance(value);
              applyAppearance(value);
            }}
            className={active ? "focus-ring flex min-h-10 items-center justify-center gap-1 rounded-md bg-accent px-2 text-xs font-semibold text-white" : "focus-ring flex min-h-10 items-center justify-center gap-1 rounded-md px-2 text-xs font-semibold text-steel hover:bg-elevated hover:text-ink"}
          >
            <Icon size={15} />
            <span className="hidden xl:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}