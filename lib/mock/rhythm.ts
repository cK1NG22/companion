/**
 * MOCK FIXTURES — daily rhythm and spiritual core
 * (Morning Review §4.8, Nightly Review §4.9, Scripture §4.5).
 */
import { subDays } from "date-fns";
import type {
  CarriedQuestion,
  MorningSection,
  NightlyEntry,
  Reading,
  ScriptureNote,
} from "../types";
import { toIsoDate } from "../week";

const dayBefore = (n: number) => toIsoDate(subDays(new Date(), n));

/** Carter's framework, in his order. Reordering and editing persist per user. */
export const MOCK_MORNING_SECTIONS: MorningSection[] = [
  {
    id: "ms1",
    title: "Humility",
    body: "I do not know enough to be proud. Every good thing I have was given to me. Start the day owing, not owed.",
    sortOrder: 0,
  },
  {
    id: "ms2",
    title: "Become",
    body: "Agency ↑ → confidence ↑. Humility and obedience ↑ → revelation, learning, networking ↑. Weight ↓, distractions ↓. The direction matters more than today's number.",
    sortOrder: 1,
  },
  {
    id: "ms3",
    title: "Commitment",
    body: "I said I would do this. The version of me that decided was clearer than the version that wants to renegotiate at 6am.",
    sortOrder: 2,
  },
  {
    id: "ms4",
    title: "Hope in the promise",
    body: "The promise is not that it will be easy. It is that it will be worth it, and that I will not be alone in it.",
    sortOrder: 3,
  },
  {
    id: "ms5",
    title: "Prepare",
    body: "What is the hardest thing today, and when will I do it? Put it early. Protect it.",
    sortOrder: 4,
  },
  {
    id: "ms6",
    title: "Gratitude",
    body: "Name three things before the day names its complaints.",
    sortOrder: 5,
  },
  {
    id: "ms7",
    title: "Why",
    body: "A family that loves each other. Work that serves people honestly. A mind that stays teachable.",
    sortOrder: 6,
  },
  {
    id: "ms8",
    title: "Prayer",
    body: "Ask for help before asking for outcomes.",
    sortOrder: 7,
  },
];

export const MOCK_NIGHTLY: NightlyEntry[] = [
  {
    date: dayBefore(1),
    gratitude:
      "Sarah made time to talk through the week even though she was tired.",
    whatHappened:
      "Shipped the goals funnel. Two client calls, one of which turned into a real pilot conversation.",
    repentAndImprove:
      "I was short with Ben on the phone because I was mid-task. Answering the phone means being present or not answering.",
    prepareForTomorrow:
      "Lay out gym clothes; put the deep-work block before email.",
    topThree: [
      "Ship Companion Phase 0 → deploy",
      "Protect the 6:45 workout",
      "Call Grandma before dinner",
    ],
    hoursConfirmed: true,
  },
];

export const MOCK_SCRIPTURE_NOTES: ScriptureNote[] = [
  {
    id: "sn1",
    date: dayBefore(0),
    reference: "Alma 32:27",
    body: '"Awake and arouse your faculties, even to an experiment upon my words." An experiment is not certainty — it is a willingness to act before the proof arrives. That is the whole thing.',
  },
  {
    id: "sn2",
    date: dayBefore(2),
    reference: "Mosiah 4:27",
    body: "Not requisite to run faster than he has strength. I keep reading this as permission to slow down; today it reads as an instruction to be honest about capacity when I plan the week.",
  },
];

export const MOCK_QUESTIONS: CarriedQuestion[] = [
  {
    id: "q1",
    text: "What does it mean to receive revelation for someone else?",
    resolved: false,
  },
  {
    id: "q2",
    text: "How do I tell desire from discipline when they feel the same?",
    resolved: false,
  },
  {
    id: "q3",
    text: "Why does gratitude come before petition in almost every prayer I admire?",
    resolved: false,
  },
];

export const MOCK_READINGS: Reading[] = [
  {
    id: "r1",
    title: "Book of Mormon",
    type: "scripture",
    progress: "Alma 32 of 63",
    percent: 51,
  },
  {
    id: "r2",
    title: "The Brothers Karamazov",
    type: "book",
    progress: "Ch. 7 of 42",
    percent: 17,
  },
  {
    id: "r3",
    title: "Preach My Gospel",
    type: "book",
    progress: "Ch. 3 of 13",
    percent: 23,
  },
];

export const MOCK_MONTHLY_STUDY_GOAL =
  "Study how faith and works relate — read Alma 32 slowly, and note every place the text asks for action before evidence.";
