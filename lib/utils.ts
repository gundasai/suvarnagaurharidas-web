import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseDateBadge(dateStr?: string): { month: string; day: string } {
  if (!dateStr) return { month: "UPCOMING", day: "•" };

  // Match month name e.g. October, Oct, November, etc.
  const monthMatch = dateStr.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)/i);

  let month = "UPCOMING";
  if (monthMatch) {
    month = monthMatch[0].toUpperCase();
  }

  // Remove the month text from date string to extract day portion
  let dayPart = dateStr;
  if (monthMatch) {
    dayPart = dateStr.replace(new RegExp(monthMatch[0], "i"), "").trim();
  }

  // Strip leading/trailing commas, spaces, dashes
  dayPart = dayPart.replace(/^[,\s-]+/, "").replace(/[,\s-]+$/, "").trim();

  // Strip trailing 4-digit year if present e.g. "3,4, 2026" -> "3,4"
  dayPart = dayPart.replace(/,?\s*\b20\d\d\b/, "").trim();

  // Format spaces cleanly
  dayPart = dayPart.replace(/\s+/g, " ");

  return {
    month: month.length > 7 ? month.substring(0, 7) : month, // e.g. "OCTOBER" or "OCT"
    day: dayPart || "•"
  };
}

/**
 * Checks if an event is today or in the future based on its end_date or date string
 */
export function isEventUpcoming(item?: { date?: string; end_date?: string }): boolean {
  if (!item) return false;
  const dateStr = item.date || "";
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // 1. If explicit end_date is present (YYYY-MM-DD format)
  if (item.end_date && /^\d{4}-\d{2}-\d{2}$/.test(item.end_date)) {
    return item.end_date >= todayStr;
  }

  // 2. Try parsing end date from ISO string if date itself is YYYY-MM-DD
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr >= todayStr;
  }

  // 3. Fallback: Parse 4-digit year in date string if present
  const yearMatch = dateStr.match(/\b(20\d\d)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    const currentYear = new Date().getFullYear();
    if (year < currentYear) return false;
  }

  return true;
}
