# Implementation Plan: Accounts + Mock Projections MVP

This plan translates the approved tracer-bullet issue breakdown into implementation phases.  
Each phase is a thin vertical slice with clear dependencies and demoable outcomes.

## Phase 1: MVP foundation + auth session spine

- **Type**: AFK
- **Depends on**: None
- **User stories covered**: 2, 3, 29, 34
- **Goal**: Enable account creation/sign-in, persistent sessions, and canonical submission ownership by `user + slate`.
- **Done when**:
  - Users can sign up/sign in and remain authenticated across sessions.
  - Session expiration prompts re-authentication without losing non-sensitive context.
  - Data model and server constraints enforce one canonical submission record per user per slate.

## Phase 2: Publishable mock slate with lifecycle states

- **Type**: AFK
- **Depends on**: Phase 1
- **User stories covered**: 4, 5, 28, 30
- **Goal**: Allow operators to publish mock slates and users to fetch the active slate with explicit availability states.
- **Done when**:
  - Admin flow can publish an active mock slate with lock deadline and 10 matchups.
  - Slate lifecycle states are represented (`draft`, `published/open`, `locked`, `resolved`).
  - Users see explicit empty/unavailable-state messaging if no active slate exists.

## Phase 3: End-to-end picks flow before lock

- **Type**: AFK
- **Depends on**: Phase 1, Phase 2
- **User stories covered**: 6, 7, 8, 9, 10, 12, 13, 15, 26, 27
- **Goal**: Deliver the main picks UX where signed-in users choose all 10 matchups and submit successfully before lock.
- **Done when**:
  - Users can view all matchups with players and projected points on one responsive screen.
  - Users can select/revise picks prior to submission.
  - Submit action provides loading, validation, retry, and success feedback.
  - Returning before lock restores previously selected picks.

## Phase 4: Idempotent submit + lock enforcement API contracts

- **Type**: AFK
- **Depends on**: Phase 3
- **User stories covered**: 11, 14, 16, 33, 34
- **Goal**: Harden mutation paths with idempotency, lock enforcement, and abuse protection.
- **Done when**:
  - Repeated submits do not create duplicate or conflicting records.
  - Post-lock submissions/updates are rejected with clear validation messaging.
  - Picks are readable in post-lock read-only mode.
  - Submission endpoints apply practical rate limiting.

## Phase 5: Resolve results from mock answer key

- **Type**: AFK
- **Depends on**: Phase 2, Phase 4
- **User stories covered**: 17, 18, 23, 31
- **Goal**: Enable deterministic outcome resolution and per-user scoring from mock actuals.
- **Done when**:
  - Admin can trigger slate resolution from a mock answer key.
  - Per-matchup winners and user correctness are computed deterministically.
  - Total correct picks out of 10 is stored and retrievable.
  - Postponed/canceled mock games follow deterministic, communicated handling.

## Phase 6: Profile/history continuity view

- **Type**: AFK
- **Depends on**: Phase 5
- **User stories covered**: 19, 20, 32
- **Goal**: Provide user-visible continuity and support/operator auditability.
- **Done when**:
  - Users can view historical slate performance over time.
  - Basic profile/history page shows account continuity and aggregate metrics.
  - Admin/support can audit whether a user submitted picks for a given slate.

## Phase 7: Scoring rules transparency + adapter seam

- **Type**: AFK
- **Depends on**: Phase 5
- **User stories covered**: 21, 35
- **Goal**: Make active scoring rules explicit while preserving future extensibility.
- **Done when**:
  - UI clearly states the active ruleset (for MVP, one primary profile such as PPR).
  - Server logic is mediated through a stable scoring adapter interface.
  - Adapter seam is ready for additional rulesets/provider-backed data later.

## Phase 8: Accessibility and keyboard-operable picks UX

- **Type**: AFK
- **Depends on**: Phase 3
- **User stories covered**: 24, 25, 26
- **Goal**: Ensure the core picks flow is operable with keyboard and assistive technologies.
- **Done when**:
  - Matchup and selection controls are fully keyboard navigable.
  - Semantic labels/roles allow screen readers to complete the flow.
  - Mobile usability remains strong for list navigation and submit actions.

## Phase 9: Inactive-player behavior policy decision

- **Type**: HITL (decision recorded in `docs/policy-inactive-players-mvp.md`)
- **Depends on**: Phase 2 (policy should be finalized before or during Phase 5)
- **User stories covered**: 22
- **Goal**: Finalize and enforce product policy for player inactivity before lock.
- **Done when**:
  - Product decision is documented (for example: lock-in-place, void matchup, or replacement policy).
  - UI and API behavior consistently reflect the approved policy.
  - Resolution logic aligns with policy so outcomes are predictable and auditable.

## Suggested execution order

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 9 (HITL decision can run in parallel planning, but must be finalized before late scoring work)
6. Phase 5
7. Phase 6
8. Phase 7
9. Phase 8
