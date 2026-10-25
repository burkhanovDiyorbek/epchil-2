"use client";

/**
 * Clean all non-digit characters from the input string.
 */
export function cleanPhoneDigits(val: string): string {
  return val.replace(/\D/g, "");
}

/**
 * Automatically format a raw string of digits into the Uzbek pattern:
 * +998 (00) 000-00-00
 */
export function formatUzPhone(val: string): string {
  // Extract all digits
  let digits = val.replace(/\D/g, "");

  // If the user started typing 998, strip it so we don't duplicate it
  if (digits.startsWith("998")) {
    digits = digits.substring(3);
  }

  // Cap at 9 digits for local number: XX XXX XX XX
  digits = digits.substring(0, 9);

  let formatted = "+998";
  
  if (digits.length > 0) {
    formatted += ` (${digits.substring(0, 2)}`;
  }
  if (digits.length > 2) {
    formatted += `) ${digits.substring(2, 5)}`;
  }
  if (digits.length > 5) {
    formatted += `-${digits.substring(5, 7)}`;
  }
  if (digits.length > 7) {
    formatted += `-${digits.substring(7, 9)}`;
  }

  return formatted;
}

/**
 * Event handler utility to handle phone typing mask transitions cleanly.
 */
export function handlePhoneInputChange(
  e: React.ChangeEvent<HTMLInputElement>,
  onChange: (val: string) => void
) {
  const input = e.target;
  const rawValue = input.value;
  
  // Format the value
  const formatted = formatUzPhone(rawValue);
  
  onChange(formatted);
}
