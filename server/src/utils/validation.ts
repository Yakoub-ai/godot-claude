import { z } from "zod";

export function coerceStringArray() {
  return z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // not JSON, return as-is
      }
    }
    return val;
  }, z.array(z.string()));
}

export function coerceNumber() {
  return z.preprocess((val) => {
    if (typeof val === "string") {
      const num = Number(val);
      if (!isNaN(num)) return num;
    }
    return val;
  }, z.number());
}

export function coerceBoolean() {
  return z.preprocess((val) => {
    if (typeof val === "string") {
      if (val === "true") return true;
      if (val === "false") return false;
    }
    return val;
  }, z.boolean());
}
