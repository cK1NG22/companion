/**
 * DATA SEAM — Morning Review (§4.8), Nightly Review (§4.9), Scripture (§4.5).
 */
import type {
  CarriedQuestion,
  MorningSection,
  NightlyEntry,
  Reading,
  ScriptureNote,
} from "../types";
import { toIsoDate } from "../week";
import {
  MOCK_MONTHLY_STUDY_GOAL,
  MOCK_MORNING_SECTIONS,
  MOCK_NIGHTLY,
  MOCK_QUESTIONS,
  MOCK_READINGS,
  MOCK_SCRIPTURE_NOTES,
} from "../mock/rhythm";

const sections: MorningSection[] = structuredClone(MOCK_MORNING_SECTIONS);
const nightly: NightlyEntry[] = structuredClone(MOCK_NIGHTLY);
const notes: ScriptureNote[] = structuredClone(MOCK_SCRIPTURE_NOTES);
const questions: CarriedQuestion[] = structuredClone(MOCK_QUESTIONS);
const readings: Reading[] = structuredClone(MOCK_READINGS);

let morningDoneOn: string | null = null;
let counter = 1;

// ---------------------------------------------------------------------------
// Morning Review — a reading, not a checklist
// ---------------------------------------------------------------------------

export async function getMorningSections(): Promise<MorningSection[]> {
  return [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Persist a new order after a drag. Index in the array becomes sortOrder. */
export async function reorderMorningSections(ids: string[]): Promise<void> {
  ids.forEach((id, i) => {
    const section = sections.find((s) => s.id === id);
    if (section) section.sortOrder = i;
  });
}

export async function updateMorningSection(
  id: string,
  patch: Partial<Pick<MorningSection, "title" | "body">>,
): Promise<void> {
  const section = sections.find((s) => s.id === id);
  if (section) Object.assign(section, patch);
}

export async function addMorningSection(): Promise<MorningSection> {
  const section: MorningSection = {
    id: `ms-new-${counter++}`,
    title: "New section",
    body: "",
    sortOrder: sections.length,
  };
  sections.push(section);
  return section;
}

export async function deleteMorningSection(id: string): Promise<void> {
  const i = sections.findIndex((s) => s.id === id);
  if (i >= 0) sections.splice(i, 1);
}

/**
 * The Morning Review tab is time-based: it appears each morning and hides once
 * marked done, returning the next day (PRD §4.8).
 */
export async function isMorningDone(): Promise<boolean> {
  return morningDoneOn === toIsoDate(new Date());
}

export async function markMorningDone(): Promise<void> {
  morningDoneOn = toIsoDate(new Date());
}

// ---------------------------------------------------------------------------
// Nightly Review
// ---------------------------------------------------------------------------

export async function getNightlyEntry(
  date: Date,
): Promise<NightlyEntry | null> {
  const iso = toIsoDate(date);
  return nightly.find((n) => n.date === iso) ?? null;
}

/**
 * Tomorrow's Plan Today reads the Top 3 that was decided tonight — "decide when
 * wise, act when prompted" (PRD §1.2).
 */
export async function getTopThreeFor(date: Date): Promise<string[]> {
  const iso = toIsoDate(date);
  // The Top 3 for a given day was written the night BEFORE it.
  const previous = nightly
    .filter((n) => n.date < iso)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  return previous?.topThree ?? [];
}

export async function saveNightlyEntry(entry: NightlyEntry): Promise<void> {
  const i = nightly.findIndex((n) => n.date === entry.date);
  if (i >= 0) nightly[i] = entry;
  else nightly.push(entry);
}

// ---------------------------------------------------------------------------
// Scripture
// ---------------------------------------------------------------------------

export async function getScriptureNotes(): Promise<ScriptureNote[]> {
  return [...notes].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function addScriptureNote(input: {
  reference: string;
  body: string;
}): Promise<void> {
  notes.push({
    id: `sn-new-${counter++}`,
    date: toIsoDate(new Date()),
    reference: input.reference,
    body: input.body,
  });
}

export async function getCarriedQuestions(): Promise<CarriedQuestion[]> {
  return [...questions];
}

export async function addQuestion(text: string): Promise<void> {
  questions.push({ id: `q-new-${counter++}`, text, resolved: false });
}

export async function toggleQuestion(id: string): Promise<void> {
  const q = questions.find((x) => x.id === id);
  if (q) q.resolved = !q.resolved;
}

export async function getReadings(): Promise<Reading[]> {
  return [...readings];
}

export async function getMonthlyStudyGoal(): Promise<string> {
  return MOCK_MONTHLY_STUDY_GOAL;
}
