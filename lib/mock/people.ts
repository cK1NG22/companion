/**
 * MOCK FIXTURES — people (PRD §4.4).
 *
 * In Part C these come from Google Contacts, with last-contact resolved as the
 * freshest of Gmail / Calendar / iMessage (the last via the local Mac agent,
 * metadata only).
 */
import type { ContactChannel } from "../types";

export interface MockPerson {
  id: string;
  name: string;
  relationship: string | null;
  nextStep: string | null;
  /** Days ago the most recent contact happened. null = never. */
  daysAgo: number | null;
  source: ContactChannel | null;
  excluded: boolean;
}

export const MOCK_PEOPLE: MockPerson[] = [
  {
    id: "p1",
    name: "Adam Reyes",
    relationship: "Optimal — co-founder",
    nextStep: "Send the revised pilot scope",
    daysAgo: 0,
    source: "calendar",
    excluded: false,
  },
  {
    id: "p2",
    name: "Sarah King",
    relationship: "Wife",
    nextStep: "Plan Friday date",
    daysAgo: 0,
    source: "text",
    excluded: false,
  },
  {
    id: "p3",
    name: "Ben Okafor",
    relationship: "Friend",
    nextStep: "Check in — he was job hunting",
    daysAgo: 3,
    source: "text",
    excluded: false,
  },
  {
    id: "p4",
    name: "Eric King",
    relationship: "Dad",
    nextStep: "Company-preview checklist",
    daysAgo: 6,
    source: "email",
    excluded: false,
  },
  {
    id: "p5",
    name: "Maya Lindqvist",
    relationship: "Former colleague",
    nextStep: "Intro to the Hoth team",
    daysAgo: 12,
    source: "email",
    excluded: false,
  },
  {
    id: "p6",
    name: "Grandma Ruth",
    relationship: "Family",
    nextStep: "Call — she likes Sunday afternoons",
    daysAgo: 19,
    source: "text",
    excluded: false,
  },
  {
    id: "p7",
    name: "Daniel Okonkwo",
    relationship: "Mission companion",
    nextStep: "Catch up, it's been too long",
    daysAgo: 34,
    source: "text",
    excluded: false,
  },
  {
    id: "p8",
    name: "Priya Raman",
    relationship: "Investor intro",
    nextStep: "Follow up on the warm intro",
    daysAgo: 41,
    source: "email",
    excluded: false,
  },
  {
    id: "p9",
    name: "Tomas Alvarez",
    relationship: "Church — elders quorum",
    nextStep: "Invite to the temple trip",
    daysAgo: 58,
    source: "calendar",
    excluded: false,
  },
  {
    id: "p10",
    name: "Auto Warranty Services",
    relationship: null,
    nextStep: null,
    daysAgo: 2,
    source: "text",
    excluded: true,
  },
  {
    id: "p11",
    name: "Delivery Notifications",
    relationship: null,
    nextStep: null,
    daysAgo: 1,
    source: "text",
    excluded: true,
  },
];

/** Past this many days without contact, a person is flagged overdue. */
export const OVERDUE_AFTER_DAYS = 30;
