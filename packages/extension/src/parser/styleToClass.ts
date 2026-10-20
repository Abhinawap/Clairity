import type { IRNode } from "shared";

type StyleProperty = keyof IRNode["style"];

const REVERSE_MAP: Partial<Record<StyleProperty, Record<string, string>>> = {
  height: {
    "20px": "h-5",
    "48px": "h-12",
  },
  width: {
    "16px": "w-4",
    "100%": "w-full",
  },
  borderRadius: {
    "4px": "rounded",
    "9999px": "rounded-full",
  },
  backgroundColor: {
    "#ffffff": "bg-white",
    "#000000": "bg-black",
  },
  color: {
    "#000000": "text-black",
    "#ffffff": "text-white",
  },
  fontSize: {
    "30px": "text-3xl",
    "18px": "text-lg",
  },
  fontWeight: {
    "600": "font-semibold",
    "500": "font-medium",
  },
};

export function styleValueToClass(property: StyleProperty, value: string): string | undefined {
  return REVERSE_MAP[property]?.[value];
}

const PROPERTY_PREFIXES: Partial<Record<StyleProperty, string>> = {
  height: "h-",
  width: "w-",
  borderRadius: "rounded",
  backgroundColor: "bg-",
  color: "text-",
  fontSize: "text-",
  fontWeight: "font-",
};

export function getPropertyPrefix(property: StyleProperty): string | undefined {
  return PROPERTY_PREFIXES[property];
}