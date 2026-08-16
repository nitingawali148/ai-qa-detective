/**
 * Chart color tokens — the validated default categorical/status palette from
 * the data-viz skill (references/palette.md), used unmodified so no
 * re-validation is required. Hues are assigned to failure categories in a
 * FIXED order (never re-cycled based on which categories are present in a
 * given dataset) so a category's color stays stable across views.
 */

export const CATEGORICAL = {
  blue: { light: "#2a78d6", dark: "#3987e5" },
  orange: { light: "#eb6834", dark: "#d95926" },
  aqua: { light: "#1baf7a", dark: "#199e70" },
  yellow: { light: "#eda100", dark: "#c98500" },
  magenta: { light: "#e87ba4", dark: "#d55181" },
  green: { light: "#008300", dark: "#008300" },
};

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};

/** Fixed category → hue slot mapping. Never reassigned based on the active dataset. */
export const CATEGORY_COLOR: Record<string, { light: string; dark: string }> = {
  "Application Defect": CATEGORICAL.blue,
  "Environment Issue": CATEGORICAL.orange,
  "Test Automation Issue": CATEGORICAL.aqua,
  "Configuration Issue": CATEGORICAL.yellow,
  "Data Issue": CATEGORICAL.magenta,
  "Flaky Test": CATEGORICAL.green,
};

export function categoryColor(category: string, isDark: boolean): string {
  const slot = CATEGORY_COLOR[category] ?? CATEGORICAL.blue;
  return isDark ? slot.dark : slot.light;
}

export function riskStatusColor(level: "Low" | "Medium" | "High" | "Critical"): string {
  switch (level) {
    case "Low":
      return STATUS.good;
    case "Medium":
      return STATUS.warning;
    case "High":
      return STATUS.serious;
    case "Critical":
      return STATUS.critical;
  }
}

/** Not a React hook — a plain DOM read of the current theme class, safe to call during render. */
export function getIsDarkMode(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}
