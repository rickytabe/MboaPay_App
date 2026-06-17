# MboaPay — Create Circle: Multi-Step Flow Upgrade Prompt

> Give this to the coding agent alongside the existing `create-circle.tsx` file and `AppContext.tsx`. The goal is to replace the current single-scroll form with a 5-step guided flow, without changing the underlying `createCircle()` database logic — only the UI/UX layer changes.

---

## 0. What stays exactly the same

- `createCircle(...)` in `AppContext.tsx` — its signature, its DB inserts, its invite code generation, its admin-membership insert. Do not touch this function's internals.
- The final payload shape passed to `createCircle()` must match exactly what it already accepts today — same field names, same types.
- `COLORS`, `TYPOGRAPHY`, `SPACING`, `ROUNDED` from `constants/Theme` remain the only styling tokens used. No new ad-hoc colors.
- The custom `Button` component already in use.
- Validation rules already enforced (name non-empty, target & contribution > 0, max members ≥ 2) — these get redistributed across steps, not removed or loosened.

## 1. What changes

Replace the single `ScrollView` form with a 5-step wizard. One screen, one concern, per step. The component still lives at `create-circle.tsx` — this is an internal restructure of that screen, not a new route, unless the agent determines step-as-separate-routes is cleaner for the existing navigation library in use (check what's already used elsewhere in the app for any existing stepper/wizard pattern before introducing a new one).

---

## 2. Step-by-step specification

### Step indicator (persistent across all steps)

- A thin progress bar or 5-dot indicator at the top of the screen, below the existing `TopNavBarComponent`.
- Shows current step position (e.g. "Step 2 of 5") and fills proportionally.
- Back chevron in the nav bar goes to the previous step; on step 1, it exits the flow entirely (existing back behavior).
- All entered data persists in component state across step navigation — going back must never clear a field.

### Step 1 — Choose circle type

**Purpose**: This determines what later steps show, so it must be answered first.

- Three full-width selectable cards (not just buttons — give each one a short one-line description so the choice is informed):
  - **Solo savings** — "Save toward your own goal, no group needed"
  - **Group pool** — "Save together, everyone keeps their own progress"
  - **Tontine (Rotation)** — "Classic njangi — take turns receiving the pot"
- Selecting a card immediately highlights it using the existing `freqButtonSelected` treatment (border `COLORS.primaryContainer`, bg `COLORS.primaryContainer + "10"`) — reuse this exact style object, don't create a new one.
- Default selection: `pool` (matches current default, preserves existing behavior for users who don't think hard about this step).
- "Next" button enabled as soon as any type is selected (one is always selected by default, so this step technically can't block — that's fine, it's a confirmation step).

### Step 2 — Name and goal

**Purpose**: Pairs the circle's identity with its target amount, since the amount only makes emotional sense next to what it's for.

- **Circle Name** — TextInput, same placeholder as today ("e.g. Dschang Alumni Savings"). Required.
- **Target Pool (XAF)** — numeric TextInput, same as today. Required, must be > 0.
- Inline validation: if the user taps "Next" with name empty or target ≤ 0, show inline error text directly below the offending field (red, using `COLORS.error`) instead of an `Alert`. This replaces the current Alert-based validation for this step specifically.
- "Next" disabled until both fields pass validation — don't just show an error on tap, also gate the button so the user gets immediate feedback as they type (debounced, not on every keystroke if that causes jank).

### Step 3 — Contribution schedule

**Purpose**: Contribution amount and frequency are interdependent — showing them together with a live projection makes the numbers concrete instead of abstract.

- **Contribution (XAF)** — numeric TextInput, same as today. Required, must be > 0.
- **Frequency** — same 3-button row as today (`Daily`, `Weekly`, `Monthly`), same `freqButtonSelected` styling. Default: `monthly` (matches current default).
- **New addition — live projection text**, computed client-side, updates as the user types or changes frequency:
  > "At [contribution] XAF [frequency], you'll reach [target] XAF in approximately [X] [days/weeks/months]."
  - Calculation: `Math.ceil(target_amount / contribution_amount)` cycles, multiplied by the cycle length in days, displayed in the most readable unit (e.g. convert to weeks/months if the day count is large). Round all displayed numbers.
  - If `contribution_amount` is 0 or empty, show a neutral placeholder instead ("Enter a contribution amount to see your timeline") rather than `Infinity` or `NaN`.
- Same inline-error pattern as step 2 for validation.

### Step 4 — Group settings (conditional step)

**Purpose**: Only relevant for `pool` and `rotation` — skipped entirely for `solo`.

**If `circle_type === 'solo'`**: this step is skipped automatically. The step indicator should show 4 total steps instead of 5 for solo circles (or show step 4 as visually skipped/grayed if the indicator design makes that simpler — agent's call on whichever is less complex to implement correctly).

**If `circle_type === 'pool'` or `'rotation'`**:
- **Maximum Members** — numeric TextInput, same as today, default `"10"`. Required, must be ≥ 2.
- **Visibility** — same two-button row (`Private` / `Public`), same contextual help text below. Default: `private`.
- **If `circle_type === 'rotation'` specifically**, add one more control beneath visibility:
  - **Commitment deposit toggle** — a switch labeled "Require a joining deposit," default ON.
  - When ON, show a percentage stepper or preset chips (e.g. `10%`, `15%`, `20%`) of the per-round contribution amount, default `15%`. Display the computed XAF amount live below it: "New members pay [X] XAF to join."
  - When OFF, no deposit is required to join — store this choice in local component state to pass through at submission (see section 3 for how this maps to the payload; this does not require a new circles table column since the deposit amount is computed and stored per-member in `circle_members.commitment_deposit` at join time, not at circle-creation time — this screen is only setting the policy/percentage that the join flow will later use).

### Step 5 — Review and create

**Purpose**: One last look before committing, replacing the current "submit and hope" pattern.

- A read-only summary card reusing the existing light-gray stats block styling already established in the Circles tab cards — consistency with what the user will see later.
- Show every value entered: circle name, type (human-readable label, not the raw enum), target, contribution amount + frequency, max members (if applicable), visibility, commitment deposit policy (if rotation).
- An "Edit" link/icon next to each section jumps back to the relevant step without losing other steps' data.
- The submit button here is the actual `Create Savings Circle` action — same loading-state behavior as today (disable button, show loading indicator).
- **Replace the current success `Alert`** with a dedicated success screen/modal (not a system Alert) that shows the invite code in a large, copyable format with a "Copy code" button and a "Share" button (native share sheet, pre-filled with circle name + invite code + a short invite message) before navigating to `/(tabs)/circles`. This matches the more modern, polished feel the user is asking for — a system `Alert` feels like a debug message, not a milestone moment for the user who just created something.
- On failure, keep an `Alert` for the error case (errors don't need a polished moment, they need to be seen and dismissed quickly) but make the message specific if the agent can extract a useful reason from the thrown error, rather than always showing a generic message.

---

## 3. Data flow — confirm payload shape is unchanged

The wizard must collect the exact same fields `createCircle()` already expects, just gathered across steps instead of one screen:

```
{
  name: string,
  circle_type: 'solo' | 'pool' | 'rotation',
  target_amount: number,
  contribution_amount: number,
  frequency: 'daily' | 'weekly' | 'monthly',
  max_members: number | null,      // null for solo
  visibility: 'private' | 'public', // irrelevant for solo, agent should decide a sensible default (likely 'private') if solo circles don't use this field at all today
  // rotation-only, not part of today's createCircle signature —
  // flag to the user if this needs a small addition to createCircle
  // to pass through a commitment deposit percentage, since the schema
  // already has circle_members.commitment_deposit as a per-member amount,
  // but the *policy* (the percentage) needs to live somewhere accessible
  // at join time. Recommend storing it in circles.goal_type or a new
  // lightweight metadata approach only if no existing field fits —
  // do not silently drop this setting if there's nowhere to put it.
}
```

**Important**: if `commitment_deposit_percentage` truly has nowhere to live in the current schema, the agent must flag this explicitly rather than building a UI control that doesn't actually persist anywhere. Don't ship a toggle that looks functional but silently does nothing.

---

## 4. Validation summary (redistributed, not removed)

| Step | Validation |
|---|---|
| 1 | None required — a type is always selected by default |
| 2 | Name non-empty; target_amount > 0 |
| 3 | contribution_amount > 0; frequency selected (always true via default) |
| 4 | max_members ≥ 2 (only when step is shown) |
| 5 | None — this step only re-displays already-validated data |

All inline, all blocking "Next" until resolved, no `Alert`-based validation except for the final submission failure case.

---

## 5. Animation and transition notes

- Step transitions should feel deliberate: a horizontal slide (new step enters from the right when going forward, from the left when going back) is the standard pattern and will read as "modern" per the user's request — check what animation library (if any) is already in use elsewhere in the app (e.g. `react-native-reanimated`) and reuse it rather than introducing a new dependency.
- Keep transitions under 250ms — anything longer feels sluggish on a form people want to complete quickly.
- The step indicator should animate its fill/position change in sync with the screen transition, not jump instantly.

---

## 6. Consistency checklist before considering this done

- Every color, font size, spacing value, and corner radius traces back to `COLORS`/`TYPOGRAPHY`/`SPACING`/`ROUNDED` — no new hardcoded values.
- Dark mode tested for every new screen (the success modal, inline error text, the live projection text, the review card).
- `KeyboardAvoidingView` behavior preserved for any step with text inputs (steps 2, 3, and 4 if shown).
- The flow works identically whether `circle_type` is changed early (step 1) and the user goes back to change it later from the review screen — step 4's conditional skip logic must re-evaluate correctly if type changes after initially being set.
- No regression to the existing `joinCircleByCode` or admin-approval flows — this prompt only touches creation, not joining.

---

*Hand this together with the circles-feature-master-prompt.md for full context if the agent is also building the rotation commitment deposit join flow — the percentage set in step 4 here is the input that flow will consume.*