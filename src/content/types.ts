export const locales = ["en", "my", "th"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeMeta: Record<Locale, { label: string; name: string; htmlLang: string }> = {
  en: { label: "EN", name: "English", htmlLang: "en" },
  my: { label: "MY", name: "မြန်မာ (Burmese)", htmlLang: "my" },
  th: { label: "TH", name: "ไทย (Thai)", htmlLang: "th" },
};

export interface Stat {
  value: string;
  label: string;
}

export interface Dict {
  meta: { title: string; description: string };
  brand: { handle: string; name: string };
  nav: {
    about: string;
    skills: string;
    experience: string;
    projects: string;
    notes: string;
    contact: string;
    menu: string;
    downloadCv: string;
    switchLanguage: string;
    toggleTheme: string;
    skip: string;
  };
  hero: {
    available: string;
    name: string;
    role: string;
    focus: string;
    statement: string;
    viewWork: string;
    downloadCv: string;
    cvType: string;
    tags: string[];
    terminal: {
      file: string;
      whoamiCmd: string;
      whoami: string;
      statsCmd: string;
      stats: Stat[];
      availabilityCmd: string;
      availability: string;
    };
  };
  about: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    principles: { title: string; body: string }[];
    collabTitle: string;
    collab: { label: string; value: string }[];
    educationTitle: string;
    education: { school: string; degree: string; period: string }[];
    languagesTitle: string;
    languages: { name: string; level: string; bars: number }[];
    awardsTitle: string;
    awards: string[];
    activitiesTitle: string;
    activities: { title: string; body: string }[];
  };
  build: {
    eyebrow: string;
    title: string;
    steps: { title: string; desc: string }[];
  };
  concepts: {
    eyebrow: string;
    title: string;
    items: { tag: string; title: string; desc: string }[];
  };
  skills: {
    eyebrow: string;
    title: string;
    groups: { title: string; desc: string; tags: string[] }[];
  };
  experience: {
    eyebrow: string;
    title: string;
    items: {
      role: string;
      org: string;
      period: string;
      place?: string;
      kind?: string;
      summary: string;
      bullets: string[];
      tags: string[];
    }[];
  };
  projects: {
    eyebrow: string;
    title: string;
    placeholderLabel: string;
    items: {
      kicker: string;
      badge?: string;
      title: string;
      desc: string;
      stats: Stat[];
      tags: string[];
      links?: { label: string; href: string }[];
      placeholder?: boolean;
    }[];
  };
  notes: {
    eyebrow: string;
    title: string;
    placeholderLabel: string;
    items: {
      iso: string;
      date: string;
      read: string;
      title: string;
      desc: string;
      tags: string[];
      placeholder?: boolean;
    }[];
  };
  contact: {
    eyebrow: string;
    title: string;
    chat: {
      name: string;
      online: string;
      lead: string;
      hello: string;
      ask: string;
      options: { label: string; subject: string; reply: string }[];
      restart: string;
      copy: string;
      copied: string;
      skip: string;
    };
    form: {
      name: string;
      namePh: string;
      email: string;
      emailPh: string;
      subject: string;
      subjectPh: string;
      message: string;
      messagePh: string;
      send: string;
      opening: string;
      invalid: string;
    };
    direct: {
      title: string;
      emailLabel: string;
      email: string;
      githubLabel: string;
      github: string;
      githubUrl: string;
      linkedinLabel: string;
      linkedin: string;
      linkedinUrl: string;
      phoneLabel: string;
      phoneMasked: string;
      reveal: string;
      revealAria: string;
      hiddenNote: string;
    };
    card: { locationCmd: string; location: string; availabilityCmd: string; availability: string };
  };
  footer: { built: string; rights: string; github: string; linkedin: string; email: string; games: string };
}

export type DeepPartial<T> = T extends (infer U)[]
  ? U[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/** English sentence -> translated sentence. Keys must match `en.ts` exactly. */
export type Phrasebook = Record<string, string>;
