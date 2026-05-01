# Policy: inactive players before lock (MVP Phase 9)

**Status**: Approved for Accounts + Mock Projections MVP.  
**Identifier**: `mvp_lock_in_place_dnp_zero_v1`  
**User story**: 22 — users see expected behavior when a player is inactive before lock.

## Decision summary

This MVP uses a **lock-in-place** rule with deterministic **did-not-play (DNP) scoring**:

1. **Before lock** — The slate may optionally label a player’s **expected participation** (mock-derived). That label is disclosure only.
2. **Picking** — Users may choose either player in every matchup regardless of inactive expectation. Submissions **do not** auto-change or void when participation notes update before lock (no substitutions in MVP).
3. **Resolution** — The admin answer key declares whether each starter **played** (`playedA` / `playedB`, default true). Anyone who **did not play** is credited **0 fantasy points** for that side. Winners are computed from finalized totals via the slate’s scoring ruleset (tie-break unchanged).
4. **Postponed games** — `policy: postponed` stays a separate outcome: matchup is **void** and does not contribute to correctness (already implemented).

## Explicitly rejected for MVP

- **Auto replacement** — no substitute player swaps before lock (added operational and UX scope).
- **Auto-void matchup** — not used when either side looks inactive before lock; only **postponed** voids unless product changes later.

## Auditability

- Pre-lock designation is persisted on matchups (`preLockParticipationA` / `preLockParticipationB`) as part of the projection snapshot when slates are built.
- Post-lock scoring records `playedA` / `playedB` plus numeric actuals stored on resolved rows for each matchup.
