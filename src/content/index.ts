import { en } from "./en";
import { my, myPhrases } from "./my";
import { th, thPhrases } from "./th";
import type { DeepPartial, Dict, Locale, Phrasebook } from "./types";

export * from "./types";

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Objects merge key-by-key; arrays and primitives are replaced wholesale. */
function merge<T>(base: T, over: DeepPartial<T> | undefined): T {
  if (over === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(over)) return over as T;
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(over)) {
    out[key] = merge(out[key], (over as Record<string, unknown>)[key] as never);
  }
  return out as T;
}

/** Swaps every string that has an entry in the phrasebook; anything else stays as it is. */
function translate<T>(value: T, book: Phrasebook): T {
  if (typeof value === "string") return (book[value] ?? value) as T;
  if (Array.isArray(value)) return value.map((v) => translate(v, book)) as T;
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = translate(v, book);
    return out as T;
  }
  return value;
}

const overrides: Record<Locale, DeepPartial<Dict> | undefined> = { en: undefined, my, th };
const phrasebooks: Record<Locale, Phrasebook | undefined> = { en: undefined, my: myPhrases, th: thPhrases };

/**
 * English is the source of truth for structure: every role, project, tag and link comes from `en.ts`.
 * A locale overrides interface labels key by key, then its phrasebook translates body copy string by
 * string. New English content shows up in every language at once and stays English until translated.
 */
export function getDict(locale: Locale): Dict {
  const book = phrasebooks[locale];
  const dict = merge(en, overrides[locale]);
  return book ? translate(dict, book) : dict;
}
