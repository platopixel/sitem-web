"use client";

import { Check } from "lucide-react";

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  opponent: string;
  projected: number;
}

interface MatchupCardProps {
  matchupNumber: number;
  playerA: Player;
  playerB: Player;
  selectedPlayerId: string | null;
  onSelect: (playerId: string) => void;
}

export function MatchupCard({
  matchupNumber,
  playerA,
  playerB,
  selectedPlayerId,
  onSelect,
}: MatchupCardProps) {
  const isPlayerASelected = selectedPlayerId === playerA.id;
  const isPlayerBSelected = selectedPlayerId === playerB.id;

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md border border-slate-200">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
        <span className="text-sm font-semibold text-slate-600 tracking-wide uppercase">
          Matchup {matchupNumber}
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-200">
        {/* Player A */}
        <button
          onClick={() => onSelect(playerA.id)}
          className={`p-5 text-left transition-all relative group ${
            isPlayerASelected
              ? 'bg-emerald-50'
              : 'hover:bg-slate-50'
          }`}
        >
          {isPlayerASelected && (
            <div className="absolute top-3 right-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            </div>
          )}

          <div className="pr-10">
            <div className="font-semibold text-slate-900 text-lg leading-tight mb-2">
              {playerA.name}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                {playerA.position}
              </span>
              <span className="text-sm text-slate-600 font-medium">
                {playerA.team}
              </span>
            </div>
            <div className="text-xs text-slate-500 mb-3">
              vs {playerA.opponent}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Projected
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {playerA.projected.toFixed(1)}
            </div>
          </div>
        </button>

        {/* Player B */}
        <button
          onClick={() => onSelect(playerB.id)}
          className={`p-5 text-left transition-all relative group ${
            isPlayerBSelected
              ? 'bg-emerald-50'
              : 'hover:bg-slate-50'
          }`}
        >
          {isPlayerBSelected && (
            <div className="absolute top-3 right-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            </div>
          )}

          <div className="pr-10">
            <div className="font-semibold text-slate-900 text-lg leading-tight mb-2">
              {playerB.name}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                {playerB.position}
              </span>
              <span className="text-sm text-slate-600 font-medium">
                {playerB.team}
              </span>
            </div>
            <div className="text-xs text-slate-500 mb-3">
              vs {playerB.opponent}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Projected
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {playerB.projected.toFixed(1)}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
