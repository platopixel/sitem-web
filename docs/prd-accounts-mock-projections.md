# PRD: Close Call Fantasy Picks (Accounts + Mock Projections MVP)

## 1. Problem Statement

Traditional fantasy football products are powerful but operationally heavy: drafts, roster management, waivers, trades, and week-long optimization. A large segment of sports fans wants a lighter experience that still captures the core “who scores more” decision-making skill.  

Current alternatives (full season leagues, DFS-style products, and social pick'em) often miss one specific interaction: **close-call player decisions** where projected points are nearly equal and personal conviction matters most. There is an opportunity to deliver a fast, repeatable format centered on those coin-flip matchups while preserving competitive continuity through user accounts.

## 2. Solution

Build a web product where each scoring period (starting with a mock NFL weekly slate) presents exactly **10 head-to-head player matchups**. Each matchup pairs players with similar projected fantasy points. The user picks which player will score more actual fantasy points for the period.

MVP scope:
- Account-based sign-in so picks, scores, and history persist.
- Mock data pipeline for projections, slates, and final outcomes (no external NFL API dependency in MVP).
- One primary fantasy scoring ruleset (e.g., PPR) with a clear extension seam for additional rulesets later.
- Server-side validation and idempotent submission behavior.
- Results view showing correctness and overall slate score after outcomes are available.

## 3. User Stories

1. As a first-time visitor, I can understand the game in under one minute so I know what action to take.
2. As a new user, I can create an account or sign in with minimal friction so my picks persist across sessions.
3. As a returning user, I stay signed in securely so I do not need to authenticate every visit.
4. As a signed-in user, I can see the current active slate (e.g., Week X) so I know what period I am picking for.
5. As a user, I can view an explicit lock deadline so I know when picks stop being editable.
6. As a user, I can see all 10 matchups on one screen so I can compare and decide efficiently.
7. As a user, each matchup clearly shows both players and their projected points so I understand why the matchup is close.
8. As a user, I can select one player per matchup with a single tap/click so the interaction is quick on mobile and desktop.
9. As a user, I can revise any unsubmitted pick before final submission so accidental taps are recoverable.
10. As a user, I can save/submit all picks in one action so I have clear completion behavior.
11. As a user, repeated clicks on submit do not create duplicate entries so my slate remains consistent.
12. As a user, I can leave and return before lock and see previously selected picks so in-progress decisions are not lost.
13. As a user, I receive clear validation if I try to submit with missing picks so I can fix issues quickly.
14. As a user, I receive clear validation if I try to submit after lock so I understand why changes are blocked.
15. As a user, I can see a confirmation that picks were accepted so I trust the submission succeeded.
16. As a user, once the slate is locked, I can still view my choices in read-only mode so I can track outcomes.
17. As a user, after results are resolved, I can see winner/loser per matchup so I understand where I was right or wrong.
18. As a user, I can see my total correct picks out of 10 so performance is easy to interpret.
19. As a user, I can see historical slate performance over time so I can track improvement.
20. As a user, I can access a basic profile/history view so my account has visible continuity.
21. As a user, I can understand which fantasy scoring ruleset is being used so outcomes feel fair and predictable.
22. As a user, if a player is inactive before lock, the UI and API communicate expected behavior so I can make informed picks.
23. As a user, if a game is postponed/canceled in mock data, the product applies and communicates deterministic handling so scoring does not feel arbitrary.
24. As a user, I can use the product with keyboard navigation so it is accessible without a mouse.
25. As a user with assistive technology, matchup and selection controls expose semantic labels so screen readers can operate the flow.
26. As a mobile user, the matchup list and submit flow work comfortably on small screens.
27. As a user on slow networks, I get loading and retry states instead of blank pages so I understand system status.
28. As a user, if the active slate is unavailable, I see an empty-state explanation rather than a silent failure.
29. As a user, if session expiration occurs mid-flow, I am prompted to re-authenticate without losing non-sensitive context.
30. As an operator/admin, I can publish a new mock slate without redeploying the app so weekly operations are lightweight.
31. As an operator/admin, I can trigger results resolution from a mock answer key so post-week scoring is repeatable.
32. As an operator/admin, I can audit whether a user submitted picks for a slate so support workflows are practical.
33. As the platform, I can rate-limit abusive submission traffic so normal users are protected.
34. As the platform, I can enforce one canonical submission record per user per slate so leaderboard/history data is trustworthy.
35. As a future product owner, I can extend from mock data to provider-backed data with minimal domain rewrite because core seams are modular.

## 4. Implementation Decisions

- **Architecture style**: Keep UI thin and domain decisions server-side. Client renders slate/picks/results and sends user intent. Server modules enforce invariant rules.
- **Matchup Builder module**:
  - Input: player pool + projections for a scoring period.
  - Output: exactly 10 pairings.
  - Invariants: no duplicate players in a slate, closeness threshold enforced, deterministic tie-breaking strategy.
  - Optional diversification policies (position/team) are configurable but non-blocking for MVP.
- **Scoring Rules Adapter**:
  - Encapsulates fantasy point rules for both projection display semantics and result resolution.
  - MVP supports one scoring profile (e.g., PPR) and keeps adapter interface stable for future variants.
- **Slate Definition module**:
  - Defines slate identity (e.g., week label), lock time, and attached matchups.
  - Reads from mock data source (static JSON or equivalent local store) for MVP.
  - Tracks lifecycle states: draft, published/open, locked, resolved.
- **Pick Submission + Validation module**:
  - Requires authenticated user session.
  - Enforces one pick per matchup and complete set of required picks.
  - Uses idempotency semantics for submit endpoint to avoid duplicate submissions.
  - Enforces lock deadline and immutable post-lock behavior.
- **Results Resolver module**:
  - Consumes mock “actual points” answer key.
  - Calculates per-matchup winner and user correctness.
  - Writes normalized results for history and future leaderboard features.
- **Auth Session boundary**:
  - Provider choice intentionally deferred; selection criteria include implementation speed, account recovery UX, and security posture.
  - Session design must support account persistence and server-side authorization for mutations.
- **Persistence model (MVP)**:
  - Core entities: user, slate, matchup, projection snapshot, pick submission, resolved result.
  - Persist projection snapshot per slate to preserve historical consistency when source data changes later.
- **API behavioral contracts (high level)**:
  - Read active slate for authenticated user.
  - Submit/update picks before lock with idempotent semantics.
  - Read user picks and resolved outcomes by slate.
  - Read user history aggregate metrics.
- **Operational decisions**:
  - Admin mechanism to load/publish next mock slate.
  - Admin mechanism to resolve completed slate from answer key.
  - Structured logging on submit/resolve paths for troubleshooting and auditability.

## 5. Testing Decisions

- **Behavior-first testing focus**:
  - Matchup builder invariants: returns 10 pairings, no self-match or duplicates, closeness bounds satisfied.
  - Pick validation rules: authenticated-only mutations, exactly one pick per matchup, lock enforcement, idempotent submit handling.
  - Results resolution: deterministic winner assignment and correct total score aggregation.
- **API-level integration tests**:
  - Happy path from slate fetch -> submit picks -> lock -> resolve -> retrieve results.
  - Error paths (missing picks, late submit, unauthorized access).
- **UI acceptance tests (selective MVP)**:
  - Core user flow on desktop and mobile breakpoints.
  - Accessibility smoke coverage (keyboard traversal and basic screen-reader semantics).
- **Regression strategy**:
  - Add tests alongside each first implementation of core modules.
  - Prior art note: repository currently has no fantasy-domain behavior tests; MVP introduces foundational unit/integration coverage.
- **Tooling direction**:
  - Unit/integration framework choice kept open (Vitest/Jest acceptable).
  - End-to-end runner optional for MVP, with phased adoption when UI flow stabilizes.

## 6. Out of Scope

- Full fantasy league management (drafts, rosters, waivers, trades).
- Real-money or DFS contest constructs and legal/compliance interpretations.
- Live odds, betting markets, and push notification systems.
- Real-time injury/news ingestion from external providers in MVP.
- Multi-sport expansion beyond NFL in MVP.
- Advanced social features (chat, leagues, friend invites) in MVP.

## 7. Further Notes

- Product copy should clarify that MVP uses mock projection/outcome data for development and demonstration purposes.
- NFL trademarks and player-name usage should be reviewed for legal/commercial launch readiness; MVP assumes internal/testing context.
- Mock data attribution should be explicit if any non-original names or datasets are included.
- Phase-2 migration path should explicitly replace mock projection/result loaders with provider ingestion while preserving domain interfaces.
