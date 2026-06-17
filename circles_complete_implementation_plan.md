# MboaPay — Circles Feature Completion Prompt

> Give this entire document to the coding agent as context before asking it to implement anything. It describes what already works, what is missing, and exactly how to build the missing pieces so they fit the existing schema, existing `AppContext.tsx` logic, and existing UI patterns without breaking anything currently functional.

---

## 0. Ground rules before touching code

1. **Do not rewrite what already works.** The circle creation flow, the join flow (public instant-join, private pending-approval), the admin approval flow, the `payCircleContribution()` wallet-deduction logic, and the existing Circles tab UI (quick action cards, segmented tab switcher, circle cards, public explore cards) are all functional and well-built. Extend them — do not replace them.
2. **Every new piece of UI or logic must read from the exact schema below.** No new columns, no renamed fields, no parallel state structures. If a feature needs data the schema doesn't have, flag it and propose the smallest possible schema addition rather than inventing a workaround in app state.
3. **All pawaPay calls remain direct client-side calls**, consistent with the existing project decision to skip edge functions. Reference the existing `/lib/pawapay/` integration if present.
4. **All Supabase calls remain direct client-side calls** via `supabase-js`, consistent with the existing project decision. Use Supabase Realtime (`postgres_changes` channel subscriptions) for any live-updating UI — never polling for UI updates, only polling for pawaPay transaction status resolution.
5. **Match the existing visual language exactly**: Trust Blue solid cards, Growth Green solid cards, light-gray stat blocks, overlapping avatar stacks with `+X` overflow badges, status pills (red `Due` / green `Paid`), badge system (`TONTINE`, `Treasurer`, `Public Pool`). New UI must look like it was built by the same designer in the same week — not bolted on.

---

## 1. The exact schema (authoritative — do not deviate)

```sql
CREATE TABLE public.users (
  id uuid NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL UNIQUE CHECK (phone ~ '^\+237\d{9}$'::text),
  mno_provider text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  email text UNIQUE,
  avatar_url text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.wallets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  balance bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XAF'::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wallets_pkey PRIMARY KEY (id),
  CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.circles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  creator_id uuid NOT NULL,
  name text NOT NULL,
  goal_type text,
  circle_type text NOT NULL CHECK (circle_type = ANY (ARRAY['solo'::text, 'pool'::text, 'rotation'::text])),
  target_amount bigint NOT NULL,
  contribution_amount bigint NOT NULL,
  frequency text NOT NULL CHECK (frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text])),
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'cancelled'::text])),
  invite_code text NOT NULL UNIQUE,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  visibility text NOT NULL DEFAULT 'private'::text CHECK (visibility = ANY (ARRAY['public'::text, 'private'::text])),
  CONSTRAINT circles_pkey PRIMARY KEY (id),
  CONSTRAINT circles_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id)
);

CREATE TABLE public.circle_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  circle_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member'::text CHECK (role = ANY (ARRAY['admin'::text, 'member'::text])),
  rotation_order integer,
  commitment_deposit bigint NOT NULL DEFAULT 0,
  deposit_status text NOT NULL DEFAULT 'pending'::text CHECK (deposit_status = ANY (ARRAY['pending'::text, 'paid'::text, 'refunded'::text])),
  member_status text NOT NULL DEFAULT 'active'::text CHECK (member_status = ANY (ARRAY['active'::text, 'pending'::text, 'defaulted'::text, 'exited'::text])),
  joined_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT circle_members_pkey PRIMARY KEY (id),
  CONSTRAINT circle_members_circle_id_fkey FOREIGN KEY (circle_id) REFERENCES public.circles(id),
  CONSTRAINT circle_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.contributions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  circle_id uuid NOT NULL,
  member_id uuid NOT NULL,
  pawapay_deposit_id uuid,
  amount bigint NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'successful'::text, 'failed'::text, 'PENDING'::text, 'COMPLETED'::text, 'FAILED'::text])),
  cycle_number integer,
  due_at timestamp with time zone,
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contributions_pkey PRIMARY KEY (id),
  CONSTRAINT contributions_circle_id_fkey FOREIGN KEY (circle_id) REFERENCES public.circles(id),
  CONSTRAINT contributions_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.circle_members(id)
);

CREATE TABLE public.disbursements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  circle_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  pawapay_payout_id uuid,
  amount bigint NOT NULL,
  round_number integer,
  trigger_type text NOT NULL CHECK (trigger_type = ANY (ARRAY['auto'::text, 'manual'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'successful'::text, 'failed'::text])),
  disbursed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT disbursements_pkey PRIMARY KEY (id),
  CONSTRAINT disbursements_circle_id_fkey FOREIGN KEY (circle_id) REFERENCES public.circles(id),
  CONSTRAINT disbursements_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id)
);

CREATE TABLE public.escrows ( ... ); -- unchanged, not part of this prompt's scope
CREATE TABLE public.refunds ( ... ); -- unchanged, not part of this prompt's scope

CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['top_up'::text, 'disbursement'::text, 'contribution'::text, 'escrow_deposit'::text, 'escrow_release'::text, 'refund'::text, 'transfer_in'::text, 'transfer_out'::text])),
  amount bigint NOT NULL,
  pawapay_ref text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'successful'::text, 'failed'::text])),
  mno_provider text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  title text NOT NULL DEFAULT ''::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.push_tokens ( ... ); -- unchanged, not part of this prompt's scope
```

**Important schema notes the agent must respect:**
- `contributions.status` has a messy CHECK allowing both lowercase (`pending`, `successful`, `failed`) AND uppercase pawaPay-style (`PENDING`, `COMPLETED`, `FAILED`) values. Standardize all NEW writes to the **lowercase** set (`pending`, `successful`, `failed`) to match every other status column in the schema (`disbursements.status`, `transactions.status`, `refunds.status` all use lowercase only). Do not introduce more uppercase writes. If reading old uppercase rows for backward compatibility, normalize them in a single mapping function, not scattered if/else checks.
- `disbursements.round_number` is nullable — populate it for `rotation` circles only. For `solo` and `pool` circles it stays null, since those disbursements are one-time terminal events per member, not cyclical rounds.
- `circle_members.commitment_deposit` defaults to `0` — this field already exists and is unused by the current implementation. This is exactly what the rotation commitment deposit feature needs; no schema change required.
- `circle_members.deposit_status` (`pending` / `paid` / `refunded`) is currently being used to track regular contribution payment status per the existing description ("flips their deposit_status in the circle to paid"). This is a naming collision risk: this same field needs to represent the rotation commitment deposit status too. **Resolve this explicitly** — see section 4.3 below for the recommended fix.

---

## 2. What already works (do not rebuild)

- Circle creation with `circle_type`, `frequency`, `contribution_amount`, `target_amount`, `visibility`
- 6-character `invite_code` auto-generation
- Public circles: instant join, appear on Explore tab
- Private circles: invite-code join, lands as `member_status: 'pending'`, admin gets push notification, admin approves to flip to `active`
- `circle_members.role` admin/member distinction
- `payCircleContribution()` — balance check, wallet deduction, `contributions` row insert, `deposit_status` flip to `paid`
- `disbursements` table with `trigger_type` (`auto`/`manual`) and `round_number`
- Circles tab UI: header, Create/Join action cards (Trust Blue / Growth Green), My Circles / Explore Public segmented switcher, detailed circle cards with type badge, Treasurer badge, Due/Paid status pill, stats block (contribution/frequency/target), avatar stack with overflow badge, next payout date
- Public circle cards: outlined border, type badge, "Public Pool" label, summary line, Join button with loading state
- Empty states for both tabs

---

## 3. What is missing (build this)

1. **Solo circle dedicated UI and flow** — currently circles render with the same card template regardless of type; solo circles need their own visual treatment since there's no "members," no "Due/Paid for the group," no avatar stack.
2. **Rotation circle round management UI** — there's no screen showing whose turn it is in the rotation, the round history, or upcoming turn order.
3. **Auto-disbursement trigger logic** — the `trigger_type: 'auto'` exists in the schema but the description says payouts are auto-disbursed "once the cycle's deadline is reached or everyone has paid" — this logic needs to be made explicit, reliable, and visible in the UI (a countdown or progress state showing how close to auto-disbursement the circle is).
4. **Commitment deposit flow for rotation circles** — joining a rotation circle should optionally require a commitment deposit before `member_status` becomes `active`. This field exists in the schema (`commitment_deposit`) but per the description, no flow currently sets or charges it.
5. **Leaderboard for pool circles** — no current UI ranks members by contribution progress within a `pool` circle.
6. **Circle detail screen** — the description only covers list-view cards; there's no full circle detail screen with tabs for Overview / Members / Activity.

---

## 4. Implementation instructions

### 4.1 Solo circle UI

When `circle_type === 'solo'`:

- The circle card on the My Circles list drops the avatar stack entirely (there is only one member: the creator) and drops the Treasurer badge (irrelevant — you're the only participant).
- Replace the avatar-stack footer row with a **progress bar** showing `(sum of this member's successful contributions) / target_amount` as a percentage, using the existing light-gray stats block styling already established for the contribution/frequency/target row — keep visual consistency, just swap the row content for solo type.
- The type badge reads `SOLO SAVINGS` instead of `TONTINE`.
- Status pill logic changes: instead of `Due`/`Paid` reflecting a recurring cycle obligation, show `On track` (green) if the member is not overdue on their current scheduled contribution, or `Overdue` (red) if `due_at` on their latest pending contribution has passed.
- Tapping a solo circle card navigates to a simplified circle detail screen (see 4.6) that drops the Members tab entirely — only Overview and Activity tabs are shown.
- When a solo circle's total successful contributions reach `target_amount`, immediately trigger the disbursement flow described in 4.3 with `trigger_type: 'auto'`, `recipient_id` = the sole member's `user_id`, no `round_number`.

### 4.2 Pool circle leaderboard

For `circle_type === 'pool'`, the circle detail screen's Members tab becomes a **leaderboard**:

- Query all `circle_members` for the circle, join with `users` for name/avatar, and for each member sum their `contributions.amount` where `status = 'successful'`.
- Rank members descending by total contributed. Show rank position (1, 2, 3...), avatar, name, a horizontal progress bar showing `total_contributed / target_amount` (each member has the same shared `target_amount` from the parent circle, per the existing schema — there is no per-member target column, so do not invent one; if individual targets are needed later, that's a separate schema change, not something to fake in app state).
- Top 3 ranks get a subtle accent: rank 1 uses `c-amber` badge styling (`background: var(--color-background-warning)` with amber-toned text), ranks 2-3 get the neutral gray treatment already used elsewhere in the app — do not introduce gold/silver/bronze medal icons or emoji, this is inconsistent with the existing flat, icon-light visual language.
- Below the leaderboard list, show each member's own "you are here" highlight if `user_id` matches the logged-in user — use the same selected/highlighted card border treatment already used elsewhere in the app for the active tab state (border-secondary at increased opacity, not a new color).
- When any individual member's total reaches `target_amount`, trigger an `auto` disbursement to that member only — does not affect other members' standing, does not pause or reset the circle. Multiple members can each independently reach target and each get disbursed at different times.

### 4.3 Rotation circle — commitment deposit + round management

**Resolve the `deposit_status` naming collision first.** The cleanest fix without a schema migration: keep `circle_members.deposit_status` meaning exactly what the existing code already uses it for — the member's **current cycle's regular contribution status** (`pending`/`paid`/`refunded`). For the **commitment deposit** (the one-time joining deposit specific to rotation circles), do not reuse `deposit_status`. Instead:
- Use `circle_members.commitment_deposit` (bigint, already exists) to store the **amount** charged.
- Use `circle_members.member_status` to gate participation: a rotation circle member stays in `member_status: 'pending'` (already a valid enum value) until their commitment deposit is paid, then flips to `active`. This reuses the exact same pending→active transition pattern the private-circle admin-approval flow already uses, so the UI pattern (a pending state with a clear next action) is already familiar in this codebase — extend it, don't duplicate it with a new field.
- Record the actual commitment deposit payment as a `contributions` row with `cycle_number: 0` (reserved to mean "joining deposit, not a regular round") and `amount` matching `commitment_deposit`. This keeps a single source of truth for "what money has this member put in" without adding a new table.

**Joining flow for rotation circles specifically:**
1. User enters invite code or taps Join on a public rotation circle.
2. If `circles.contribution_amount` times some agreed deposit percentage (recommend a flat business rule: 15% of one round's contribution amount, computed client-side, not stored as a separate schema field) is required, show a confirmation screen: "This is a rotation circle. To join, pay a one-time commitment deposit of [X] XAF."
3. On confirmation, charge the deposit via the existing wallet-deduction pattern used in `payCircleContribution()` — same balance check, same deduction logic, reused as a function rather than copy-pasted.
4. Insert the `cycle_number: 0` contribution row, set `circle_members.member_status: 'active'`, set `circle_members.commitment_deposit` to the charged amount.
5. Assign `rotation_order` — next available integer in sequence for that circle (query `MAX(rotation_order) + 1` for existing active members, default to 1 if none).

**Round management UI** (new screen, accessible from the rotation circle's detail page):
- Header shows current round number, computed as `MAX(disbursements.round_number) + 1` for the circle (or `1` if no disbursements yet).
- A horizontal ordered list of all active members sorted by `rotation_order`, with the current round's recipient (the member whose `rotation_order` matches the current round number, wrapping with modulo if rounds exceed member count) visually highlighted using `c-amber` styling consistent with leaderboard rank-1 treatment from 4.2 — reuse the same color decision, don't invent a new accent.
- Below the order list, show per-member payment status for the current round (paid/pending) as small status dots next to each avatar in the order list — green dot for `contributions.status: 'successful'` this round, gray/outline dot for not yet paid.
- A progress indicator: "X of Y members have paid this round."

**Auto-disbursement trigger logic** (applies to rotation, and reused for solo/pool target-reached triggers):
- Implement as a single reusable function, e.g. `checkAndTriggerDisbursement(circleId)`, called after every successful contribution write (not on a separate cron/poll — trigger it inline right after the contribution that might complete the round/target, since this app has no edge functions and no background job runner per the existing architecture decision).
- For `rotation`: condition is "every `active` member's current-round contribution status is `successful`." When true, sum all current-round contributions, call the existing pawaPay payout integration (the agent should already have a payout helper from the pawaPay client integration guide — reuse `initiatePayout`, do not write a second implementation), insert a `disbursements` row with `trigger_type: 'auto'`, `round_number` = current round, `recipient_id` = current round's recipient. Poll the payout status using the existing polling helper, update `disbursements.status` to `successful` on completion, and insert a matching `transactions` row with `type: 'disbursement'` for the recipient.
- For `solo`/`pool`: condition is "this specific member's lifetime successful contributions to this circle ≥ `target_amount`." Same disbursement mechanics, `round_number: null`.
- After any successful disbursement, insert a `notifications` row for the recipient (`type` like `'circle_payout'`, clear `title`/`message`) and, for rotation circles, a notification to all other members announcing the round completed and who received it — this is a core trust-building feature for the rotation model, members should never have to wonder if a round disbursed correctly.
- Surface a live countdown or progress state in the round management UI reflecting how close the round is to triggering ("3 of 5 paid — waiting on 2 more"), updated via Supabase Realtime subscription on the `contributions` table filtered by `circle_id`, not by polling.

### 4.4 Circle detail screen (new)

A single screen, navigated to by tapping any circle card from the My Circles list. Structure:

- Header: circle name, type badge, Treasurer badge if applicable, invite code with a copy button.
- A summary stats row reusing the existing light-gray stats block component already used on the list cards (contribution amount / frequency / target), so this screen feels like a natural continuation of the card the user tapped, not a different design system.
- Tab bar below the header, tabs vary by circle type:
  - **Solo**: Overview, Activity
  - **Pool**: Overview, Members (leaderboard per 4.2), Activity
  - **Rotation**: Overview, Round (per 4.3), Members, Activity
- **Overview tab**: progress visualization (single progress bar for solo/pool-member's-own-progress, or round-completion progress for rotation), next due date, days remaining until `ends_at` if set.
- **Activity tab**: chronological list combining `contributions` and `disbursements` for this circle, each row showing member name/avatar, amount, type (contribution/payout), timestamp, and status badge (reuse the existing Due/Paid pill color logic: green for successful, red for failed, gray/amber for pending).
- **Admin-only addition**: if the logged-in user's `circle_members.role === 'admin'` for this circle, show a manual disbursement trigger button on the Overview tab (calls the same `checkAndTriggerDisbursement` logic but bypasses the auto-condition check, consistent with the existing `trigger_type: 'manual'` enum value already in the schema) and, for private circles, a pending member approval list reusing the existing admin-approval logic already built — do not duplicate that logic, surface it here as well as wherever it currently lives.

### 4.5 Visual and interaction consistency checklist

Before considering this done, the agent should verify:

- New badges (`SOLO SAVINGS`, round-recipient highlight, leaderboard rank treatment) use the same badge component/styling already used for `TONTINE` and `Treasurer` — same padding, same corner radius, same font weight, just new label text and the established color tokens.
- No new color introduced outside the existing Trust Blue / Growth Green / Community Gold / status semantic colors already defined in the theme file. The amber accent used for leaderboard rank 1 and rotation round-recipient highlight should map to the existing `tertiary`/`tertiaryContainer` (Community Gold) tokens already in the theme — not a new ad-hoc amber.
- All new screens respect the dark mode theme file already fixed for contrast — test every new component against `DARK_COLORS`, not just `LIGHT_COLORS`.
- All new database writes go through direct Supabase client calls, no edge functions.
- All new pawaPay-related writes generate the UUID client-side, store it before calling the API, and poll for final status using the existing polling helper — no new parallel implementation of this pattern.
- Realtime subscriptions are cleaned up (`supabase.removeChannel`) on component unmount for every new screen that subscribes to live updates.

---

## 5. Build order (suggested, not mandatory)

1. Resolve the `deposit_status` semantics decision (4.3) first — this is a logic decision, not a UI build, and everything else depends on it being settled.
2. Build `checkAndTriggerDisbursement(circleId)` as a standalone, reusable function and unit-test it conceptually against all three circle types before wiring it into any UI.
3. Build the circle detail screen shell (4.4) with the Overview tab only, for all three types, reusing existing stats block styling.
4. Add the Pool leaderboard tab (4.2).
5. Add the Rotation commitment deposit join flow and Round tab (4.3).
6. Add the Solo-specific card and detail treatment (4.1) — last, since it's the simplest and most isolated change.
7. Pass over everything with the consistency checklist (4.5).

---

*This document is the single source of truth for completing the circles feature. If anything here conflicts with a future instruction, flag the conflict rather than silently picking one.*