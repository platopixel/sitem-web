import { NextResponse } from "next/server";
import {
  DEFAULT_SCORING_RULESET_ID,
  listRegisteredScoringAdapters,
  serializeScoringTransparency,
} from "@/lib/scoring";

/**
 * Public catalog surface for tooling and future admin/provider wiring.
 */
export async function GET() {
  return NextResponse.json({
    defaultRulesetId: DEFAULT_SCORING_RULESET_ID,
    rulesets: listRegisteredScoringAdapters().map(serializeScoringTransparency),
  });
}
