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
import { subDays } from "date-fns";
import { toIsoDate } from "../week";
import { MOCK_MONTHLY_STUDY_GOAL } from "../mock/rhythm";
import { store } from "../mock/store";

const sections = store.morningSections;
const nightly = store.nightly;
const notes = store.scriptureNotes;
const questions = store.questions;
const readings = store.readings;

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
  return store.morningDoneOn === toIsoDate(new Date());
}

export async function markMorningDone(): Promise<void> {
  store.morningDoneOn = toIsoDate(new Date());
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
  // Strictly the night BEFORE — not "the most recent entry". If a nightly
  // review was skipped, today genuinely has no Top 3, and showing a two-day-old
  // list as if it were today's plan is worse than showing none.
  const previousNight = toIsoDate(subDays(date, 1));
  return nightly.find((n) => n.date === previousNight)?.topThree ?? [];
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
