# Companion — Product Requirements Document

**A personal calendar, scheduler, and goal-tracking app modeled on the Preach My Gospel / Missionary planner.**

Owner: Carter · Working title: *Companion* · Status: pre-build (mockup + spec)
Last updated: 2026-10-04 · Mockup (visual reference of record): **`~/Projects/companion/mockup.html`** — open locally, or the Artifact: claude.ai/code/artifact/72342dce-b616-4b10-ad65-9200faa58dd0
Related: architecture plan in auto-memory `plan-pmg-life-app.md`. **This PRD is the spec of record** — where it and the memory plan disagree, this wins.

---

## 1. Vision & principles

Companion runs Carter's whole week as the PMG loop — **Goal → Plan → Act → Account** — on a weekly (and daily) cadence, with **people, not tasks**, as a first-class unit of progress, and the **spiritual life kept central**, not bolted on.

Design principles that constrain every feature:

1. **One input surface; everything else is a derived view.** The **Calendar** is where *time* is entered. "Planned" hours, allocation breakdowns, and the dashboard are read-only rollups computed from calendar blocks. Never let the same fact be edited in two places. *(One sanctioned exception: a **checked-off to-do** also increments a `count` input — see §4.1a. Time still comes only from the calendar.)*
2. **Decide when wise, act when prompted.** Reflection (Morning Review) is separate from logistics (Plan Today); goals are set at their own altitude and only *referenced* below. Top 3 is decided at night and surfaced in the morning.
3. **Line of sight.** Every weekly goal ladders to a monthly goal, which ladders to a yearly goal. The link is chosen by the human during planning, never inferred.
4. **Plain and minimal.** Palette: white / near-black (navy-biased) / navy accent + one muted clay for "behind/overdue/now." No neon. Georgia serif reserved for devotional/journal text.
5. **Single-user.** Just Carter. Google OAuth is identity + all integrations in one consent. No accounts system. *([NMT] 2026-10-04: the goal-agnostic direction below speaks of "people" and "users" deciding their own goals. Whether that means other people use the app is undecided — see §6. Until decided, this principle stands.)*
6. **Goal-agnostic: fixed structure, user-defined content (added 2026-10-04).** The goal-setting process — **Goals → Plans → Inputs** (§4.2) — is preserved. What fills it is not: no goal, plan, input or other goal detail is hardcoded. The user decides their own goals inside the app, changes them, and reorders them, and can change the location and layout of pages. See §4.0.

## 2. Tech stack (proposed — validate at kickoff)

- **Frontend:** Next.js / React, PWA-capable (phone use). Deploy on Vercel.
- **Store:** Neon Postgres.
- **Auth:** Google OAuth — one consent grants Calendar (r/w), Gmail (read), Contacts (read), Docs (write). App stays in Google "testing" mode (single user → no verification needed).
- **Local agent (Mac, launchd):** required for the two things the cloud can't reach — **iMessage** recency (`~/Library/Messages/chat.db`) and the **Claude Bumstead** workout hand-off.

## 3. Core data model (concepts)

- **Goal** — has: title, tier (`year` | `month` | `week`), parent goal (line-of-sight link), optional **icon** (chosen from an icon set; used everywhere the goal appears), optional **note** (making it actionable), optional weekly **target** (a number + unit: hours or days/count).
- **Key Indicator** — a weekly input with a target that shows as a glance tile. Tracks **Target → Planned → Done**.
  - **Target** = the weekly number (e.g. 20h deep work). Sets the grey base of the bar / denominator.
  - **Planned** = the week's calendar blocks assigned to this goal, measured per the KI's **unit** (below).
  - **Done** = the same, confirmed at night. Fills the bar in the solid color.
  - **`unit` (decided 2026-07-20)** — one field on the KI that determines *how* Planned/Done are computed and *what the tile's pop-up shows*. See §4.1a.
- **Calendar block** — start/end, title (the "event name"), assigned goal (→ icon), source (Companion-planned vs Google), and a confirmed actual duration once logged. **Blocks with the same name inside a goal are grouped** into one allocation row (name is the join key — projects emerge from what's scheduled).
- **Habit** — a daily binary discipline in the weekly grid, grouped (Required / Standards of Excellence / Weekly). Distinct from KIs: KIs are measured (hours/counts), habits are checked (did / didn't).
- **Person** — contact + relationship + next step + last-contacted (max of email/text/calendar signal), plus **tags** (zero or more — §4.4) and an **in-outreach-rotation** flag (§4.4). *(Both added 2026-10-04.)*
- **Tag** *(added 2026-10-04)* — a user-defined label for grouping people. A person can carry any number of tags; tags are what the People list is filtered and sorted by.
- **To-do** — name, optional notes, optional **duration** (minutes/hours). "Schedule" creates a calendar block of that duration.
- **Morning Review section** — title, body, sort order. User-editable/reorderable (the ⋮ Forms-style editor); order + text persist.
- **Nightly entry** — date, the five answers (gratitude / what happened / repent+improve / prepare / **Top 3 for tomorrow**), and whether hours were confirmed. Top 3 is read by tomorrow's Plan Today.
- **Purpose statement** — a single long-lived serif block shown on Home.
- **Scripture note** — date, passage/reference, body (serif); plus **Question carried** (open list), **Monthly study goal**, and **Reading** (title, type = scripture|book, progress e.g. "Ch. 7 of 42").
- **Exercise / Set** — Gym: an exercise has a name + muscle group + a Bumstead-suggested target; a **set** is weight × reps × timestamp. Derived: estimated **1RM** per lift, per-lift trend, and **per-muscle fatigue** = recent volume (wt×reps) ÷ days rest.
- **Feedback item** — free text, **kind (`app_edit` | `date_research`)**, tab it refers to, created-at, status (`queued` → `applied`/`rejected`), and the commit/diff or researched idea the runner produced. This is the table the laptop runner polls (§4.11).
- **Date planner (§4.12) — hybrid, mostly NOT stored.** Restaurants are **live from Google Places**; nothing about them persists but recency. Activities are a **small curated owned table** (APIs can't price them). The stored pieces:
  - **`place_history`** — `(provider, place_id, last_done_date, source)`. The only restaurant data we keep — personal recency, seeded from the debit-card import. Joined against live Places results at render to sink recently-done to the bottom.
  - **`activities`** — `(id, name, category, price_tier 1–4, price_note, lat, lng, notes, booking_url, last_done_date, status)`. First-party, hand-researched (enriched via the §4.11 runner). Distinct from restaurants precisely because Places APIs give no activity price/niche-category.
  - **home coordinates** — the user's, stored permanently (their data, not an API's). Set by the user, not shipped as a fixture (§4.12, "Location").
  - *(No `date_ideas`/`date_instances`/`date_principles` tables — superseded by this design; a "date instance" is just a `last_done_date` on the two tables above.)*

---

## 4. Per-tab requirements

### 4.0 Customization — goal-agnostic content and layout — **ADDED 2026-10-04**
Carter's direction: the app is agnostic to goals. Users decide their own goals inside the app, make changes, and reorder things; none of that detail is hardcoded. Users can also change the locations and layouts of pages. The goal-setting process (Goals → Plans → Inputs) is preserved.

**Stays fixed (the process):**
- The three tiers and what each means (§4.2), and the ladder between them.
- Target → Planned → Done for weekly inputs (§3).
- The week running Monday → Sunday (§4.10).

**Becomes user-defined (the content):**
- **Goals, plans and inputs** at every tier: add, rename, **reorder**, **delete**, pick icon, set parent. *(Reorder and delete were "future" in §4.2 until this date.)*
- **Page location and layout:** the user can change where pages sit and how they are laid out.
- **No feature may find a goal by what it means.** A feature that needs a specific goal gets it from an explicit user setting — never from an icon or a title match.

**Hardcoded in the build as of 2026-10-04** (what this section has to remove):
- The Date planner tags events to "the family goal" by looking for the heart icon (§4.12; `lib/actions/dates.ts`).
- Icon labels carry meanings ("heart" = Family) in `components/common/goal-icon.tsx`.
- The three habit groups and their labels (§4.1; `components/home/habit-grid.tsx`).
- The sidebar's page list and order (`components/shell/app-sidebar.tsx`).
- The Nightly Review questions (§4.9; `components/nightly/nightly-review.tsx`).
- The seed goals, habits and people in `lib/mock/` — fixtures today, but they are the only content the app has.

**[NMT] — not decided:**
- **How far layout editing goes.** An ordered list with show/hide per page and per Home section reuses the Morning Review pattern (§4.8). A free-form grid of movable sections is a larger build and widens what the accessibility gates must cover.
- **Whether the habit grid's groups and rows are user-defined** the same way goals are.
- **Whether the Nightly Review questions stay locked** (§4.9 says the order is locked) or become editable like Morning Review sections.
- **Whether Scripture and Gym are optional pages.** Both are specific to Carter's goals.
- **Whether two input units are enough** (§4.1a). `hours` and `count` were chosen for Carter's goals; `tally` and `value` are deferred there for lack of a use case.
- **What past weeks show after a goal is renamed or deleted.** The week stepper (§4.1) browses prior weeks; either they rewrite themselves or goals need a start and end date.
- **What deleting a goal does** to its child goals and to the calendar blocks and to-dos tagged to it.

### 4.1 Home (hub)
- **Header:** date + a **week stepper** (‹ ›) to browse prior/next weeks; the whole dashboard reflects the selected week. Buttons: **Plan today** (→ Plan Today flow), **Weekly planning** (→ Weekly Planning flow). *(These are the only two nav entries for Plan Today and Weekly Planning — neither has a sidebar tab.)*
- **Purpose statement** (serif) at top.
- **"This week at a glance" tiles** = the Key Indicators (Deep work, Scripture, Workouts, Reached out, …). Each tile: title, done/target, tri-state bar (grey target → light planned → solid done). **Tap a tile → allocation pop-up** (see below). No captions under tiles, no color legend.
  - **Allocation pop-up:** for the tapped goal — grouped-by-name breakdown of its calendar blocks (planned + done per project), the goal's total tri-state bar, and totals. Only planned/done colors (a row doesn't exist until planned).
- **Weekly habit grid** (replaces the old KI *table*): rows grouped **Required** (Book of Mormon, Daily plan, Exercise), **Standards of Excellence** — *daily* (**Service** = one kind act, big or small · **Reading** = 30 min of a paper book · **Outreach** = message one friend to check in), **Weekly** (Date night, Weekly planning, Temple). Columns **Mon–Sun (Monday first, Sunday last)**, binary check cells. Mirrors Carter's existing spreadsheet tracker.

### 4.1a Input units & the tile pop-up — **DECIDED 2026-07-20**
Each KI carries a **`unit`**. **Only two exist: `hours` and `count`.**

| Unit | Example | Planned/Done computed as | Tile pop-up |
|---|---|---|---|
| **hours** | Deep work 20h | **Σ durations** of contributing items | Allocation pop-up: grouped by block name (as built) |
| **count** | Workouts 5 · Outreach convos 10 · Scripture 7 | **Number** of contributing items | List of the actual items + dates |

**`days` is not a unit — it's just `count`.** "Scripture 7 days" is a count input with target 7. Same column, same query. *(Carter's call, and it's right: a separate unit type would have bought nothing.)*

- **Sub-case, if it ever bites:** count counts *items*, so two scripture blocks on one Monday would read as 2, not 1. If that turns into inflated numbers in real use, the fix is **one boolean on the KI — "count once per day"** (a `DISTINCT date` in the query), *not* a third unit type. Don't build it preemptively.

**`count` draws from two sources: calendar blocks AND checked-off to-dos** (decided — some outreach conversations happen unscheduled). Both are items tagged to the goal; the pop-up lists them together, labelled by origin.
- ⚠️ **This is a deliberate exception to "the calendar is the single input surface" (§1.1).** To-dos become a second way a count goes up. Accepted because a to-do is still an explicit user action with a timestamp, not a competing edit of the same fact — but it means the §1 principle now reads *"calendar is the only place **time** is entered"* rather than the only input, full stop.

**Deferred, no use case yet:** `tally` (manual +1, e.g. pages read) and `value` (a number you overwrite, e.g. bodyweight — a trend line, not a bar). Both need a genuinely new input surface; add only when a real goal demands one.

### 4.2 Goals (the funnel) — **Goals → Plans → Inputs**
The three tiers mean three different things, and this is the app's core information flow:
- **Year = Goals** — who I'm becoming / how I want to improve ("Grow Optimal to $30k MRR", "Be a present father"). Broad, identity-level.
- **Month = Plans** — the concrete **means**: what I'll ship or the categories I'll move ("Ship Companion for daily use", "Run 100 outreach conversations"). More milestone/to-do in nature. Each **ladders to a yearly goal**.
- **Week = Inputs = Key Indicators** — the measurable weekly **inputs** that feed the plans ("Deep work 20h", "Workouts 5", "Scripture 7 days"). Each **ladders to a monthly plan**.

**The weekly inputs ARE the Home "This week at a glance" key-indicator tiles.** Setting a weekly input in Goals is what populates a KI tile on Home. This is the key distinction Carter drew: a **plan** (ship a product) is *fed by* an **input** (deep-work hours) — so a milestone plan is tracked by the inputs beneath it, while inputs are the things with a weekly Target→Planned→Done number.
- **Line of sight:** month-only cadence (quarter/6-week toggle removed — Carter prefers short cycles). Parent links are **set during planning**, not inferred, shown as "↑" chips.
- **Icons:** each goal/plan/input can carry an icon; the icon represents it on the calendar.
- **Yearly goals** carry letter badges (A/B/C/D) used as the ladder targets.
- **Goal notes:** a goal can carry an actionable note (e.g. Network → "grow my ability to receive personal revelation; a real desire to know people, not add contacts").
- **Goal icons:** each goal has an **icon** chosen from an assortment (book/faith, dumbbell/health, laptop/deep-work, phone/outreach, heart/family, temple, moon/review, target, …). The icon represents the goal **everywhere** — most importantly on calendar blocks.
  - **Picker UX (decided 2026-07-20): popover grid.** In Edit Goals mode the goal's icon becomes a compact `[icon ▾]` trigger; clicking it drops a small 3-wide grid of the icon set (plus a "+" for a future custom icon); picking one swaps it and closes. Chosen over an always-visible inline row (too busy in the funnel) and a searchable picker (overkill for ~7 icons). Built into the mockup for feel.
- **Edit Goals** button (was "+ New goal"): toggles edit mode → **add a goal at each tier** (year/month/week), rename inline, **reorder, delete**, pick icon, set parent. Editing should feel like a lightweight inline editor. *(Updated 2026-10-04: reorder and delete were listed as "future"; §4.0 makes them required.)*
- **Outreach card** (moved here): people going stale, sorted, with a next step + overdue flag. *(This is the People-tab data surfaced on Goals; see §4.4.)*
- **To-do list** (Apple-Reminders style): each item = name + optional notes + **duration** (min/hr) + a **Schedule** button. Adding an item works from the inline form (name / notes / duration / Add). **Duration drives the length of the calendar event** when scheduled.

### 4.3 Calendar (Notion-modeled)
- **Views:** a dropdown (where "Week" used to be) with **Day / 3-day / Week**. All share one **24-hour, vertically scrollable** time axis.
- **View settings:** a settings dropdown to control the visible hour window (e.g. **6 AM – 11 PM**, 5–10, 7–7, or full day). Full 24h always exists; the setting frames/scrolls what's shown.
- **Now-line:** a horizontal line (muted clay) with a dot at the current time, on today's column only.
- **Past = grey:** any block whose time has passed renders greyed/desaturated (Notion behavior).
- **Goal icons on blocks:** a block reads **[event name] + [goal icon]** — no text labels like "Deep work"/"Health." The icon is the goal's chosen symbol.
- **Blocks are the input:** creating a block = name it + assign a goal (+ duration). This is what fills "Planned" on the Home tiles. Confirming a block's real duration at night fills "Done."
- **Google Calendar sync:** two-way. Existing Google events appear; Companion-planned blocks are written back.
  - **Reaffirmed 2026-10-04 — both directions:** an event **made in Companion** is created in Google Calendar, and an event **made or changed in Google** is pulled into Companion.
  - **Status 2026-10-04:** not wired. The "Synced with Google" text in the build is a label only.
  - **[NMT] — not decided:**
    - **The conflict rule** when the same event changes on both sides between syncs.
    - **Which Google calendars** are read, and which one Companion writes to.
    - **Where the goal assignment and confirmed duration live** for an event that originated in Google. Google has no field for either.
    - **Deletes and recurring events** — whether a delete on one side deletes on the other, and how a recurring Google event appears as blocks.
    - **When a pull happens** — on page load, on a schedule, or on a push from Google.
- Legend shows the goal-icon assortment.

### 4.4 People (keep-in-touch)
- Sorted by **staleness** — "days since last contact," where last-contact = the freshest of **email / text / calendar meeting**.
  - **Automatic (reaffirmed 2026-10-04):** people Carter hasn't talked to recently move to the top on their own. There is no manual ordering. Someone never contacted sorts above everyone.
- **Groups are tags (added 2026-10-04).** A person can carry any number of tags, and the tags are used to sort and filter the contacts. Tags are user-defined (§4.0) — none ship hardcoded.
- **In the outreach rotation, or not (added 2026-10-04).** Each person carries a mark for whether they are included in the cycle of recency for outreach. Someone marked out is not surfaced as going stale.
  - **[NMT]:** whether this is the existing exclusion toggle below, or a separate mark. The exclusion toggle does two things at once — hides the person from the list *and* skips their handle in the iMessage scan. A separate mark would allow a third state: visible and scanned, but out of the rotation.
- Per person: relationship, next step, channel signals, last-contact source, overdue flag.
- Fed by **Google Contacts** (list), **Gmail** (last email), **Calendar** (last meeting), and **iMessage** (last text — via the local Mac agent; the one non-cloud source).
- Identity resolution v1: match on exact email/phone from Contacts; skip unknowns.
- **Texts refresh is on-demand, not continuous (decided 2026-07-20):**
  - A **"Refresh contact signals" button** in the app sets a pending flag. A **lightweight launchd agent** on the Mac checks that flag on a slow schedule (e.g. hourly) and, **when it sees one pending, runs the scan and clears it.** So the work happens the next time the Mac is on — no daemon grinding through the message DB all day.
  - **Metadata only — message *bodies* are never read.** The agent queries `chat.db` for **handle (phone/email) + the timestamp of the most recent message**, one row per conversation. It does **not** select the `text` column. Nothing but "who" and "when" ever leaves the Mac; no message content is stored, transmitted, or sent to any model.
  - **Exclusion list (decided 2026-07-20):** a **toggle on each person** marks them excluded — filtered out of the People list *and* out of the scan itself, so excluded handles are never queried. Above the list, a **search bar** filters people **by name against Carter's phone contacts**, so anyone can be found and toggled quickly without scrolling.
    - **Source of contacts (decided 2026-07-20):** Carter's contacts currently live in **iCloud**. He'll do a **one-time iCloud → Google Contacts sync** so the app reads them through the **Google People API that's already in the OAuth consent** — no extra integration, and the Mac agent stays scoped to *texts only*. (macOS Settings → add the Google account → enable Contacts, or an export/import; one-time.) If the sync ever proves flaky, the fallback is the Mac agent reading the local Contacts store — but don't build that unless needed.
  - The agent still needs macOS **Full Disk Access** to read `chat.db` — a one-time grant.
  - The button should show last-refreshed ("synced 2h ago") so a stale list is obvious.
- *(The condensed "Outreach" view of this also appears on the Goals tab.)*

### 4.5 Scripture Study
- **Study notes** (serif) per day / passage.
- **Questions I'm carrying** — a running list of questions to hold while reading.
- **Monthly study goal** — what to study this cycle.
- **Currently reading** — scriptures + books (Carter tracks books too), with progress.
- Future: link a note to the day's Morning Review / journal.

### 4.6 Gym
- **Workout comes from Claude Bumstead** (Carter's existing launchd workout bot). Bumstead **suggests** weights, reps, times, distances; Carter **logs actuals** per set. *This closes a calibration loop: the app is where the suggestion is shown and the actual is recorded.*
  - **Integration options (decide at build):** (a) Bumstead writes the day's workout to the app store (Companion becomes the surface Carter logs into, replacing/augmenting the Slack reply); or (b) Carter keeps replying in Slack and a local agent parses the reply → app. Recommend (a) for a clean log; keep Slack as a notification.
- **Today's session:** each exercise shows suggested target + logged sets (weight × reps chips; PR highlighted). Unlogged sets are enterable.
- **Progress over time:** per-lift trend (heaviest set / estimated 1RM) across weeks; body-weight trend.
- **Strength & fatigue model (to build — this is the calibration brain):**
  - **1-rep-max estimates** per lift (e.g. Epley: `1RM = w × (1 + reps/30)`), computed from logged sets. Consider also Brzycki/averaged.
  - **Fitness goals** (e.g. "Bench 225×1 by October") with progress toward the estimated 1RM.
  - **Fatigue / readiness per muscle group** = a function of recent **volume (weight × reps)** weighed against **days of rest since that muscle was last worked**. Feeds Bumstead's next suggestion (don't hammer a fatigued muscle; push a fresh one).
  - Output: Bumstead reads goals + 1RM + fatigue to pick tomorrow's suggested weights/reps.

### 4.7 Plan Today (flow — reached from Home "Plan today")
*Separate from Morning Review.* Purpose: turn intention into a scheduled day.
- **Left — today's schedule:** today's calendar blocks (with goal icons) + a note of **open windows** (free time).
- **Right — to schedule:** **Top 3 for today** (carried from last night's Nightly Review) + the **to-do list**, each with a **duration** and an **Add-to-calendar** action that drops it into an open window as a block of that duration.
- The Top 3 lives here, **not** in Morning Review.

### 4.8 Morning Review (a reading, not a checklist)
- Carter **reads the same examination every day** to start. No checkboxes.
- Card titled **"Morning Review"** with the ordered sections (his framework): Humility, Become (agency↑→confidence↑, humility/obedience↑→revelation/learning/networking↑, weight↓/distractions↓), Commitment, Hope in the promise, Prepare, Gratitude, Why, Prayer.
- **Editable via a ⋮ menu (Google-Forms mechanics):** enter edit mode → **drag to reorder** sections, **edit any section's title/text** inline, **delete**, **add new sections**. Order + content persist per user.
- **Sequence cue:** after reading, "Next: Read scriptures → / Plan the day →" (Morning Review → Scripture → Plan Today).
- Tab is **time-based:** appears each morning, hides once marked done, returns next morning.

### 4.9 Nightly Review
- **Question order (locked):**
  1. What am I grateful for?
  2. What happened today?
  3. How can I repent and improve?
  4. How will I prepare for tomorrow?
  5. **Top 3 for tomorrow** — defined here at night, **carried into tomorrow's Plan Today**.
- **Confirm today's time (accounting):** a prompt to adjust today's calendar blocks to match reality, then one **Confirm & log hours** button → writes actual durations into "Done" totals.
- **Journal:** the free-text answers **append to a Google Doc** so the journal stays in one place.
  - **Test target (created 2026-07-20):** *Companion Journal (test)* — `1sYDPE4nSE-MKdQOj-1MtXIZabXB3M2-NiVIhfU5TvLw`. Build and verify appends against this doc.
  - **Swap to Carter's real journal doc once appends are proven correct** — the doc id is config, not code, so it's a one-line change. Do not point at the real journal until the append flow is trusted (appends are hard to un-do in a doc you care about).
- Always available (unlike Morning Review).

### 4.10 Weekly Planning (flow — reached from Home "Weekly planning")
- The ~weekly PMG session: **1) Review last week** (KI actuals vs target, wins/misses) → **2) Set this week's goals** (with **this month's goals shown as a reference** so the week is set against the month) → **3) Time-block** into Google Calendar.
- **Week = Monday → Sunday** (Monday is day one, Sunday is the last day) everywhere: the habit grid, the calendar week view, and the week stepper. The planning session itself is anchored to a configurable day (default Sunday evening, since Sunday closes the week).

### 4.11 Feedback bot (self-improvement loop)
- A **floating circle** in the bottom-right corner, present on every tab. Tapping it opens a small composer: *"What would you like to change?"* Carter types free-text feedback naming the tab + the change ("On the Calendar tab, make past events fade more").
- Submitted feedback is **queued** (shown in the panel; persisted).
- **The runner:** a job on Carter's own laptop **polls the feedback queue during the day**, and for each item **makes the edit to the app and (once trusted) commits and pushes it live** — since Companion is single-user, self-editing + auto-deploy is acceptable. Start conservative: the runner makes edits on a branch / opens a PR (or writes a diff for review); graduate to auto-push once it's reliable. This turns the app into a self-improving loop driven by real usage.
- Build notes: queue store (Neon table or a file the runner reads), a runner (launchd, like Bumstead) that reads new feedback → applies a Claude Code edit to the repo → tests → deploy. Guard rails: only touch the Companion repo; keep an undo/rollback; log every applied change.
- **Two modes (added 2026-07-20):** a segmented toggle in the composer — **Improve app** and **Date idea**.
  - *Improve app* → the edit-the-app flow above (`kind = app_edit`).
  - *Date idea* → Carter describes a date idea; the item is queued as `kind = date_research`. The runner **researches it** (finds possible locations + details) and **adds it to the Date planner's idea database** (§4.12) instead of editing code. Same bubble, same queue, different handler by `kind`.

### 4.12 Date planner
A shared date tab for Carter + his wife. **One principle, codified not written: "Try something new."** The old "principles" card is gone; the subtitle under the title is just **"Try something new!"** — enacted by sorting everything so the most-recently-done sinks to the **bottom** and novel/never-done rises to the top.

**One toggled list, not two side-by-side (updated 2026-07-20b).** A **Food / Activity toggle** top-right shows one list at a time. Tapping a row opens a **Google-Maps-style detail popup**; from the popup a single button crosses over to the *other* type nearby. Rationale (Carter): "I won't always get food when I do an activity, and vice versa" — so the cross-over is a **deliberate button**, never an automatic pairing. Food and Activity are still architecturally different underneath (decided 2026-07-20 after API research):

**Data architecture — the hybrid (this is the core decision):**
- **Food = 100% live from Google Places API (New). We store nothing about restaurants.** Google is the only API exposing all three filters Carter wants — **cuisine** (`italian_restaurant`…), **price** (`priceLevel` → $$$$), and **proximity** (Nearby Search around home *or* current GPS, `rankPreference: DISTANCE`). Every filter is a live query parameter. *We literally cannot cache venue data* — every major provider's TOS forbids storing anything but the opaque `place_id` — which conveniently **enforces** the "no owned database" principle Carter wanted.
- **Activities = a small curated table we own.** Places APIs give **no price** for activities, **no category** for niche types (climbing, escape rooms, pottery/craft classes aren't in Google's tag list), and **nothing** for ticketed experiences. So activities are hand-researched first-party rows — legit, because it's *our* content, not warehoused API data. Schema: `activities(id, name, category, price_tier 1–4, price_note, lat, lng, notes, booking_url, last_done_date, status)`.
- **The only data we store, period:** `place_history(provider, place_id, last_done_date, source)` for restaurants (recency), the `activities` table, the user's **home coordinates**, optional favorites. No venue names/prices/cuisines/coords for restaurants ever persist.
- **Cost = $0/month** (single-user, ~100–300 lookups vs Google's ~1,000/mo free tier for price-bearing fields; 10k/mo basic). Google requires a **card on file** but we set a **hard quota + $0 budget cap** so it *cannot* bill — calls hard-stop at the free limit. **The map + place detail keep it free:** the map is Google's **Maps Embed API** (free, unlimited); place detail (hours/phone/website/rating) is a Place Details call inside the free cap; **photos are the one field with real cost, so show 1–2 and link to Google Maps for the full gallery.** Straight-line distance for "closest" (free math); Apple Maps remains a free "Directions" hand-off link. (Apple's own API is rejected: it exposes neither price nor cuisine to developers — the $$$$ badge in the Apple Maps app is Google-sourced under the hood.)

**The three-level flow (both directions mirror):**
1. **List** — the toggle picks Food *or* Activity. Proximity bar (Home / current GPS · within N mi) + type-specific filters (food: cuisine · price; activity: category · price + "+ Add activity"). Each row: icon, name, cuisine/category, price, distance, last-done chip, chevron. Recently-done greyed and sunk to the bottom.
2. **Detail popup** (tap a row) — a **Google-Maps-style card over the dimmed list**: photo strip, ★ rating, price, cuisine/category, address, hours, phone, website, menu (food), a **mini map**, **Directions ↗** (Apple Maps hand-off) and **+ Schedule** buttons, and one primary **"Explore [activities/food] near {name} →"** button.
3. **Explore** (the primary button) — closes the popup and fills the tab: a **map** with the anchor + nearby pins of the *other* type, and a **proximity-sorted list** (closest first) of that other type, with a **‹ Back**. Tapping a row there opens *its* detail popup → its own "Explore" → **bounces** food ⇄ activity as far as Carter wants. This is the "sometimes just dinner, sometimes just an activity" model: pairing is always opt-in.

**Scheduling a date — the pairing prompt (added 2026-07-20c):** the **+ Schedule** button in a detail popup opens a schedule dialog whose behavior depends on whether you arrived via the cross-over:
- **Paired** (you drilled from the other type — e.g. picked a restaurant, explored activities, tapped one): the dialog asks **"Include {first-selected}?"** (checked by default). Checked → the event is named **"{first} + {second}"** (`{Restaurant} + {Activity}` when food-first; `{Activity} + {Restaurant}` when activity-first — order follows selection). Unchecked → schedules **only** the current item. A live preview shows the resulting event name.
- **Single** (you tapped a place and scheduled it without crossing over): no prompt; the event is just that place.
- **Both locations in the notes:** the calendar event's **notes** get a 📍 line per included place (name + address), so Carter can **navigate to each from his calendar app**. Unchecking "Include" drops that place from both the name and the notes.
- The event is tagged to the **family** goal (heart) and lands on the calendar.

**Location — manual or live (added 2026-10-04):** dates need location data, and it comes one of two ways.
- **Manual** — a location the user enters: their home, or another place to search from.
- **Live** — the device's current location.
- This is the "Home / current GPS · within N mi" proximity bar in level 1 of the flow above. **Status 2026-10-04:** the bar is not built. The build centres every list on a fixed fixture home and fixed radii.
- **[NMT] — not decided:**
  - **How a manual location is entered** — typed address (needs a geocoding call inside the free cap), a pin on the map, or pasted coordinates.
  - **Whether live coordinates are ever stored,** or used for the query and discarded.
  - **Whether "dates" here also means calendar events.** A calendar block has no location field today; the Date planner writes 📍 lines into its notes instead.

**Data plumbing for the flow:**
- Food list/detail = live Google Places (list = Nearby/Text Search; detail = Place Details; map = Maps Embed).
- Activity list/detail = the curated `activities` table (+ Maps Embed for its map).
- Explore proximity = the clicked anchor's coords → for the *other* type, a straight-line rank over the curated activities table (food→activities) or a **live Google Nearby Search centered on the activity's coords** (activity→food). No stored venue data for restaurants.
- **+ Add activity → enrichment flow:** paste a name or URL → the **existing feedback-bot runner** (§4.11, `kind=date_research`) fetches the site, extracts category + price + description + booking link, geocodes it, writes `status='pending_review'` → Carter confirms → `active`. No new plumbing.

**Dice Roll button:** picks a **cuisine you haven't had lately** (from the cuisine enum, filtered by `place_history` recency) → live Nearby Search in radius → closest match; and an **activity you haven't done lately** (curated table, within radius). Shows both on one card with **Re-roll** and **Schedule both**. Favors novelty via the recency filter; if the "stale" pool is empty it drops the novelty filter for that roll rather than erroring. Dice Roll never writes `last_done` (only real history does). Edge cases: `openNow` on the food search, widen radius once if empty, then a plain "add one for this area" prompt.

- **Schedule** (per row or "Schedule both") drops a calendar block tagged to the **family** goal (heart icon).
- **Recency source:** `last_done` seeded from the **debit-card import** (§5) — Claude flags date-looking transactions and logs the day + place, resolving restaurants to a `place_id` and discarding the rest.

---

## 5. Cross-cutting / integrations

| Concern | Approach |
|---|---|
| Auth / identity | Google OAuth (single user, testing mode) |
| Calendar | Google Calendar two-way sync (source of truth for time) |
| Journal | Append nightly entry to a Google Doc (Docs API). Test doc: `1sYDPE4nSE…` → swap to the real journal once proven |
| People signals | Google Contacts + Gmail + Calendar (cloud) |
| Texts signal | **On-demand** local Mac launchd agent — button sets a flag, agent runs next time the Mac is on. Reads **handle + last-message timestamp only, never message bodies**; honors an exclusion list |
| Workouts | **Claude Bumstead** (launchd) **writes the day's workout into the app**; Carter logs actuals in the Gym tab; Slack stays as the notification only |
| Venue data (Dates) | **Google Places API (New)** — live for restaurants (cuisine + `priceLevel` $$$$ + Nearby Search by distance). **$0/month** at single-user volume; **hard quota + $0 budget cap** so it can't bill (card on file required but neutered). Store only `place_id` + our own recency (TOS forbids caching venue data — which enforces the no-database rule). |
| Maps / distances / directions | **Google Maps Embed API** (free, unlimited) renders the place detail's mini-map + the Explore map. Straight-line math in Postgres (free) for "what's near." **Apple Maps hand-off** via `maps.apple.com` URL for turn-by-turn (free link). Google data must ride a Google map, per TOS — so the embed is Google, and Apple stays a directions link. Place Details (hours/phone/rating) within free cap; **photos are the one paid field → show 1–2, link out for the rest.** |
| Past dates | **Debit-card expense import** — Carter downloads card transactions; Claude flags date-looking ones and logs the day + place, resolving restaurants to a `place_id` (§4.12) and discarding the rest. Seeds `last_done` without manual tracking. One-time + repeatable. |
| Hosting | Vercel; Neon Postgres |

## 6. Decisions & open questions

### Decided 2026-07-20
1. **Texts/iMessage — build it, but on-demand and metadata-only.** A **Refresh** button sets a pending flag; a light launchd agent runs the scan the next time the Mac is on, then clears the flag. It reads **handle + last-message timestamp only — never message bodies** — and honors an **exclusion list** of people to skip. Full detail in §4.4.
2. **Journal — test doc created**, `1sYDPE4nSE-MKdQOj-1MtXIZabXB3M2-NiVIhfU5TvLw` ("Companion Journal (test)"). Build against it; **swap to the real journal once appends are proven**. Doc id is config.
4. **KI tiles vs habit grid — keep both**, split by rule: **tiles = things with a number** (20h, 5 workouts); **grid = things that are yes/no** (journaled, temple, date night).
6. **Bumstead ↔ Gym — the bot writes the workout into the app.** Carter logs actuals there. **No Slack-reply parsing** (fragile free-text). Slack stays as the nudge to go log it.
7. **Goal icons — the mockup's assortment is approved** (book, dumbbell, laptop, phone, heart, temple, moon). Picker UX still to design.
3. **Input units — two only: `hours` and `count`** (§4.1a). **`days` is just `count`** — no separate type. **`count` draws from calendar blocks *and* checked-off to-dos.** `tally`/`value` deferred.
8. **Exclusion list — a toggle per person**, plus a **search bar** over his phone contacts to find people fast (§4.4).
5. **Standards of Excellence — defined** (§4.1): three *daily* items — **Service** (one kind act), **Reading** (30 min of a paper book), **Outreach** (message one friend to check in).
9. **Contacts — iCloud today; Carter will sync to Google** once, so People reads the Google People API already in scope. Mac agent stays texts-only (§4.4).
11. **Week runs Monday → Sunday** everywhere (§4.10). Planning session still anchors to Sunday evening.

10. **Goal-icon picker — popover grid** (decided): `[icon ▾]` trigger in Edit Goals → 3-wide grid → pick swaps it. Built into the mockup (§4.2).

### Directed 2026-10-04
12. **Goal-agnostic.** No goal detail is hardcoded; users decide, change and reorder their own goals, and can change the location and layout of pages. The Goals → Plans → Inputs process is preserved (§1.6, §4.0).
13. **Google Calendar sync goes both ways** — make events, pull events (§4.3). Reaffirms the existing spec.
14. **People: stale people rise to the top automatically; groups are tags; each person is marked in or out of the outreach rotation** (§4.4).
15. **Dates need location data, manual or live** (§4.12).

### Still open
Remaining build-time details: custom-icon support, exact planning-session anchor time.

**[NMT] — opened by the 2026-10-04 direction.** Each is spelled out where it applies:
- **Single-user or not** (§1.5). Goal-agnostic content and other people using the app are separable. The second reverses §1.5 and bears on the $0 rule: a Google OAuth app in "testing" mode is limited in who can use it, and publishing one that reads Gmail requires Google's review. *(Recalled, not verified — check Google's current OAuth policy before relying on it.)*
- **Layout depth, habit groups, Nightly questions, optional pages, input units, goal history, goal deletion** (§4.0).
- **Sync conflict rule, calendars, ownership of goal assignment, deletes and recurrence, pull timing** (§4.3).
- **Outreach mark vs the exclusion toggle** (§4.4).
- **Manual location entry, storing live coordinates, location on calendar events** (§4.12).

## 7. Build phasing

Supersedes the older phase list in the memory plan. Every tab in §4 is slotted here — nothing is unassigned.

- **Phase 0 — Foundations:** validate stack (decision guides + `scout-stack`); Next scaffold → Vercel deploy; Google OAuth (Calendar r/w, Gmail read, Contacts read, Docs write); Neon schema (see below).
- **Phase 1 — Weekly loop (core):** Goals funnel (**Goals→Plans→Inputs**, month-only, icons, Edit Goals) · Calendar (Notion-style: Day/3-day/Week, 24h scroll, view settings, now-line, grey past, goal icons) + two-way Google sync · Home (week stepper, KI tiles = weekly inputs, tri-state bars, allocation pop-up, habit grid) · Weekly Planning flow · to-do list w/ duration + Schedule. *Usable daily driver after this.*
- **Phase 2 — Daily ritual + spiritual core:** Morning Review (reading, ⋮ Forms-style editor) · Plan Today flow (today's calendar + to-dos + Top 3) · Nightly Review (locked question order, **Confirm & log hours**, journal appends to Google Doc) · Scripture tab.
- **Phase 3 — People + Gym + Dates:** keep-in-touch engine (Contacts/Gmail/Calendar + **local iMessage launchd agent**) · Outreach card · Gym: log sets, per-lift trend, **1RM + fatigue model** ↔ Bumstead hand-off · **Date planner (§4.12):** Google Places live food search (cuisine/$$$$/proximity, $0 quota-capped), curated `activities` table + runner enrichment, recency sort (recent-at-bottom), cross-linking by distance, **Dice Roll**, Apple Maps directions hand-off, **debit-card import** seeding `place_history`.
- **Phase 4 — Feedback loop (§4.11):** the bubble + queue (both modes: app-edit + date-research), then the **laptop launchd runner** (poll queue → Claude Code edit *or* date-idea research → test → branch/PR, graduating to auto-push). Ship the bubble early if cheap — it collects real feedback during Phases 1–3 even before the runner exists.

**Neon schema to build** (replaces the shorter list in the memory plan): `goals` (self-referential parent, tier, icon, note, weekly target) · `calendar_blocks` (goal_id, name, start/end, confirmed_actual, google_event_id) · `habits` + `habit_entries` · `todos` · `people` + `contact_events` · `weekly_plans` · `nightly_entries` · `morning_sections` · `scripture_notes` + `readings` + `questions` · `exercises` + `sets` · `feedback_items` (+ `kind`) · `place_history` (restaurant recency) + `activities` (curated) + `home_location` · `purpose_statement`. *(No date_ideas/date_instances tables — food is live-only, activities are the owned table; see §4.12.)*

**Additions 2026-10-04 — not yet slotted into a phase.** The phase list above predates §4.0 and the People and Dates additions, so the claim that nothing is unassigned no longer holds for these:
- **Schema:** `tags` + `person_tags` (many-to-many), and an in-outreach-rotation column on `people` (§4.4). `goals` already carries a sort order; reorder and delete need no new table.
- **Unslotted work:** goal reorder and delete (§4.2), page location and layout editing (§4.0), removing the hardcoded items listed in §4.0, People tags and the outreach mark (§4.4), the Dates location bar (§4.12).
- `BUILD-PLAN.md` §7 still lists goal reordering and deletion as deliberately deferred. This PRD outranks it.

## 8. Proposed — not decided (2026-10-04) — **[NMT]**

Ideas raised while working through the 2026-10-04 direction. None is a requirement. Each is here so it is not lost; move one into §4 when it is decided.

**Features**
- **Cadence per tag, sorted by ratio.** Rank people by days-since-contact ÷ the cadence wanted for their tag, instead of raw days. A close friend at 20 days can then outrank an acquaintance at 40. Today one 30-day cutoff applies to everyone.
- **Tags seeded from Google Contacts labels.** The People API already in the OAuth consent exposes them.
- **"Talked today" button.** An in-person conversation is invisible to the email, text and calendar signals.
- **Snooze a person** until a date.
- **Next step → to-do → calendar block.** Completing an outreach to-do updates that person's last contact and the `count` input in one action.
- **Starter templates.** Carter's current goals, habits and Morning Review become the first template instead of code, so a new setup is not a blank page.
- **Onboarding as the funnel itself** — year, then month, then week.
- **Month and year reviews.** Only the week tier has an "account" step today (§4.10).
- **Location on calendar blocks,** carried to and from Google's event location field.
- **A Settings page.** None exists. Candidates to live there: home location, page order, the calendar hour window, the planning-session day, outreach cadences.
- **Data export.**

**Principles**
- **Fixed grammar, free vocabulary.** The funnel's shape stays; every name, icon and count is data. *(The reasoning behind §1.6.)*
- **Nothing finds a goal by its meaning.** *(Already adopted as a rule in §4.0.)*
- **Editing changes the future, not the past.** A renamed or deleted goal leaves past weeks as they were.
- **Every integration has a manual fallback** — location, last contact, a calendar that works without Google.
- **One owner per fact, across systems.** Extends §1.1 to Google: one side owns an event's time, the other owns its goal assignment.
- **Use and discard live sensitive data.** Live coordinates are queried, not stored — the same stance as the iMessage metadata-only rule (§4.4).
- **Configurable never means required.** Everything customizable ships with a working default.
- **List order is the nudge.** Dates sinks what was done recently; People raises who is going stale.

*This PRD documents intended functionality captured from mockup-review feedback. It is the spec of record for the build; the mockup is the visual reference.*
