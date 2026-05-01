/** Phase 9: stable id for auditing and cross-service contracts. */
export const INACTIVE_PLAYER_POLICY_ID = "mvp_lock_in_place_dnp_zero_v1";

export type InactivePlayerPolicyPayload = {
  policyId: typeof INACTIVE_PLAYER_POLICY_ID;
  shortLabel: string;
  summary: string;
  bullets: readonly string[];
};

export function getInactivePlayerPolicyPayload(): InactivePlayerPolicyPayload {
  return {
    policyId: INACTIVE_PLAYER_POLICY_ID,
    shortLabel: "Lock-in-place, DNP scores zero",
    summary:
      "Mock slates may flag a player as expected inactive before lock. You can still pick either side; picks stay locked with the slate. After lock, resolving uses the answer key: anyone who did not play scores 0 fantasy points. Postponed games use the separate “void matchup” rule.",
    bullets: [
      "Inactive labels before lock never auto-clear your pick or substitute another player.",
      "Did-not-play sides are credited 0 fantasy points at resolve time unless the matchup is postponed (void).",
      "Deterministic ties use the slate ruleset (MVP Standard PPR defers winner to Player A on equal totals).",
    ],
  };
}
