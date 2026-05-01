export type FantasyScoringAdapterId = string;

/**
 * Mediates matchup outcome logic and copy for transparency.
 * Plug additional entries into `BY_ID` later (new rulesets / provider-loaded profiles).
 */
export interface FantasyScoringAdapter {
  readonly id: FantasyScoringAdapterId;
  readonly displayName: string;
  /** Full sentence or two for disclosure panels */
  readonly rulesSummary: string;
  /** Short suffix next to projected numbers in lists, e.g. "proj · mock PPR" */
  readonly projectionValueSuffix: string;
  readonly tieBreakerLine: string;
  readonly mockDataDisclaimer: string;

  compareActualTotalsWinner(actualA: number, actualB: number): "A" | "B";
}

export type ScoringTransparencyPayload = {
  rulesetId: string;
  displayName: string;
  rulesSummary: string;
  projectionValueSuffix: string;
  tieBreakerLine: string;
  mockDataDisclaimer: string;
};

const MVP_STANDARD_PPR: FantasyScoringAdapter = {
  id: "mvp_mock_standard_ppr_v1",
  displayName: "Standard PPR (mock MVP)",
  rulesSummary:
    "Projections and final scores use standard PPR-style fantasy totals (including 1 point per reception, with typical rushing/receiving/yards and touchdown weights). MVP data is illustrative only—not live NFL or provider-fed stats.",
  projectionValueSuffix: "proj · mock PPR",
  tieBreakerLine: "Identical finalized totals defer to Player A as the matchup winner.",
  mockDataDisclaimer: "Points are deterministic mock projections and outcomes for development and demos.",
  compareActualTotalsWinner(actualA, actualB) {
    if (actualA >= actualB) return "A";
    return "B";
  },
};

const BY_ID = new Map<FantasyScoringAdapterId, FantasyScoringAdapter>([
  [MVP_STANDARD_PPR.id, MVP_STANDARD_PPR],
]);

export const DEFAULT_SCORING_RULESET_ID = MVP_STANDARD_PPR.id;

/** Default MVP adapter when no slate context is loaded (marketing / profile disclosures). */
export function getDefaultScoringAdapter(): FantasyScoringAdapter {
  return MVP_STANDARD_PPR;
}

/** Slates persisted before Phase 7 use the default MVP ruleset ID. */
export function getScoringAdapterForSlate(slate: { scoringRulesetId?: string | null }): FantasyScoringAdapter {
  const candidate = slate.scoringRulesetId?.trim();
  if (candidate && BY_ID.has(candidate)) {
    return BY_ID.get(candidate)!;
  }
  return MVP_STANDARD_PPR;
}

export function getScoringAdapterByIdStrict(id: string): FantasyScoringAdapter | undefined {
  return BY_ID.get(id);
}

/** Enumerate registered adapters for catalogs and future extension points (admin, provider ingestion). */
export function listRegisteredScoringAdapters(): readonly FantasyScoringAdapter[] {
  return Array.from(BY_ID.values());
}

export function serializeScoringTransparency(adapter: FantasyScoringAdapter): ScoringTransparencyPayload {
  return {
    rulesetId: adapter.id,
    displayName: adapter.displayName,
    rulesSummary: adapter.rulesSummary,
    projectionValueSuffix: adapter.projectionValueSuffix,
    tieBreakerLine: adapter.tieBreakerLine,
    mockDataDisclaimer: adapter.mockDataDisclaimer,
  };
}
