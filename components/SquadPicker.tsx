"use client";

import { useMemo, useState, useTransition } from "react";
import { List, type RowComponentProps } from "react-window";
import { saveCabinet } from "@/app/pick/actions";
import type { MP, Pick as PickT, Tier } from "@/lib/types";

type MPWithRole = MP & {
  currentRole: { titleLabel: string; roleType: string } | null;
};

type KnownRole = { titleLabel: string; roleType: string };

const TIER_ORDER: Tier[] = ["S", "A", "B", "C", "D", "E"];

const TIER_BADGE: Record<Tier, string> = {
  S: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
  A: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  B: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  C: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  D: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  E: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

const ROLE_BADGE: Record<string, string> = {
  pm: "bg-yellow-200 text-yellow-900",
  great_office: "bg-rose-200 text-rose-900",
  cabinet: "bg-amber-200 text-amber-900",
  attending: "bg-emerald-200 text-emerald-900",
};

const ROLE_LABEL: Record<string, string> = {
  pm: "PM",
  great_office: "Great Office",
  cabinet: "Cabinet",
  attending: "Attending",
};

export function SquadPicker({
  mps,
  knownRoles,
  initialPicks,
  locked,
}: {
  mps: MPWithRole[];
  knownRoles: KnownRole[];
  initialPicks: PickT[];
  locked: boolean;
}) {
  const mpById = useMemo(() => new Map(mps.map((m) => [m.id, m])), [mps]);

  const [picks, setPicks] = useState<PickT[]>(initialPicks);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<Set<Tier>>(
    new Set(["S", "A", "B", "C"])
  );
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "name" | "tier">("price");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const totalCost = picks.reduce((sum, p) => sum + (mpById.get(p.mpId)?.price ?? 0), 0);
  const remaining = 100 - totalCost;
  const overBudget = totalCost > 100;
  const fullSquad = picks.length === 10;
  const canSave = fullSquad && !overBudget && !locked;

  const usedRoleLabels = new Set(
    picks
      .map((p) => p.predictedRole?.trim().toLowerCase())
      .filter((s): s is string => !!s)
  );

  const visibleMPs = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = mps.filter((m) => {
      if (!showAll && !tierFilter.has(m.tier)) return false;
      if (showAll && tierFilter.size > 0 && !tierFilter.has(m.tier)) return false;
      if (q && !m.name.toLowerCase().includes(q) && !m.constituency.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
    list = list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "tier") {
        const t = TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier);
        return t !== 0 ? t : b.price - a.price;
      }
      return b.price - a.price || a.name.localeCompare(b.name);
    });
    return list;
  }, [mps, search, tierFilter, showAll, sortBy]);

  function togglePick(mpId: string) {
    if (locked) return;
    setMessage(null);
    setPicks((curr) => {
      const idx = curr.findIndex((p) => p.mpId === mpId);
      if (idx >= 0) {
        const next = [...curr];
        next.splice(idx, 1);
        return next;
      }
      if (curr.length >= 10) {
        setMessage({ kind: "err", text: "Squad full — drop someone first" });
        return curr;
      }
      const mp = mpById.get(mpId);
      if (!mp) return curr;
      const newCost = curr.reduce((s, p) => s + (mpById.get(p.mpId)?.price ?? 0), 0) + mp.price;
      if (newCost > 100) {
        setMessage({ kind: "err", text: `Over budget — would spend £${newCost.toFixed(2)}` });
        return curr;
      }
      return [...curr, { mpId }];
    });
  }

  function setPredicted(mpId: string, role: string) {
    setPicks((curr) =>
      curr.map((p) =>
        p.mpId === mpId
          ? { ...p, predictedRole: role === "" ? undefined : role }
          : p
      )
    );
  }

  function toggleTier(t: Tier) {
    setTierFilter((curr) => {
      const next = new Set(curr);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function onSave() {
    setMessage(null);
    startTransition(async () => {
      const res = await saveCabinet({
        picks: picks.map((p) => ({ mpId: p.mpId, predictedRole: p.predictedRole ?? null })),
      });
      if (res.ok) {
        setMessage({ kind: "ok", text: `Saved! Total spend: £${res.totalCost.toFixed(2)}` });
      } else {
        setMessage({ kind: "err", text: res.error });
      }
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
      <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
        {locked && (
          <div className="p-3 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-sm">
            🔒 Squads locked — read-only.
          </div>
        )}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm uppercase tracking-wide text-zinc-500">
              Budget
            </span>
            <span className={`text-sm font-medium ${overBudget ? "text-red-600" : ""}`}>
              £{totalCost.toFixed(2)} / £100
            </span>
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded overflow-hidden">
            <div
              className={`h-full ${overBudget ? "bg-red-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(100, (totalCost / 100) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            {overBudget
              ? `Over by £${(totalCost - 100).toFixed(2)}`
              : `£${remaining.toFixed(2)} remaining`}{" "}
            · {picks.length}/10 picked
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 text-sm font-medium">
            Your squad
          </div>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {Array.from({ length: 10 }).map((_, i) => {
              const pick = picks[i];
              const mp = pick ? mpById.get(pick.mpId) : null;
              return (
                <li key={i} className="px-3 py-2 text-sm">
                  {mp ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => togglePick(mp.id)}
                          disabled={locked}
                          className="text-left flex-1 min-w-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${TIER_BADGE[mp.tier]}`}>
                              {mp.tier}
                            </span>
                            <span className="truncate font-medium">{mp.name}</span>
                          </div>
                          <div className="text-xs text-zinc-500 truncate">
                            {mp.constituency}
                          </div>
                        </button>
                        <span className="text-xs tabular-nums">£{mp.price.toFixed(2)}</span>
                        {!locked && (
                          <button
                            type="button"
                            onClick={() => togglePick(mp.id)}
                            className="text-zinc-400 hover:text-red-500 text-lg leading-none px-1"
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <select
                        disabled={locked}
                        value={pick.predictedRole ?? ""}
                        onChange={(e) => setPredicted(mp.id, e.target.value)}
                        className="text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-1 py-1"
                        title="Predict the exact role for bonus points"
                      >
                        <option value="">— predict role (optional) —</option>
                        {knownRoles.map((r) => {
                          const used = usedRoleLabels.has(r.titleLabel.toLowerCase());
                          const isMine = pick.predictedRole === r.titleLabel;
                          if (used && !isMine) return null;
                          return (
                            <option key={r.titleLabel} value={r.titleLabel}>
                              {r.titleLabel}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ) : (
                    <span className="text-zinc-400 italic">Slot {i + 1} empty</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={!canSave || isPending}
          className="w-full px-4 py-2 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium text-sm disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save squad"}
        </button>
        {message && (
          <div
            className={`p-3 rounded-md text-sm ${
              message.kind === "ok"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}
      </aside>

      <section>
        <h1 className="text-2xl font-bold mb-3">Pick your cabinet</h1>
        <div className="space-y-3 mb-4">
          <input
            type="search"
            placeholder="Search name or constituency…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            {TIER_ORDER.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTier(t)}
                className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                  tierFilter.has(t)
                    ? `${TIER_BADGE[t]} border-transparent`
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-500"
                }`}
              >
                Tier {t}
              </button>
            ))}
            <label className="ml-2 text-xs flex items-center gap-1 select-none">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
              />
              Show all 411
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "price" | "name" | "tier")}
              className="ml-auto text-xs px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <option value="price">Sort: Price</option>
              <option value="name">Sort: Name</option>
              <option value="tier">Sort: Tier</option>
            </select>
          </div>
          <div className="text-xs text-zinc-500">
            {visibleMPs.length} MP{visibleMPs.length === 1 ? "" : "s"} shown
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <List<MPRowProps>
            rowComponent={MPRow}
            rowCount={visibleMPs.length}
            rowHeight={64}
            rowProps={{
              mps: visibleMPs,
              pickedSet: new Set(picks.map((p) => p.mpId)),
              locked,
              onToggle: togglePick,
            }}
            style={{ height: "70vh" }}
          />
        </div>
      </section>
    </div>
  );
}

type MPRowProps = {
  mps: MPWithRole[];
  pickedSet: Set<string>;
  locked: boolean;
  onToggle: (id: string) => void;
};

function MPRow({
  index,
  style,
  mps,
  pickedSet,
  locked,
  onToggle,
}: RowComponentProps<MPRowProps>) {
  const mp = mps[index];
  if (!mp) return null;
  const picked = pickedSet.has(mp.id);
  return (
    <div
      style={style}
      className={`px-3 py-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-3 ${
        picked ? "bg-emerald-50/60 dark:bg-emerald-950/30" : ""
      }`}
    >
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${TIER_BADGE[mp.tier]} shrink-0`}>
        {mp.tier}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{mp.name}</div>
        <div className="text-xs text-zinc-500 truncate">
          {mp.constituency}
          {mp.currentRole && (
            <>
              {" · "}
              <span
                className={`text-[10px] px-1 py-0.5 rounded ${ROLE_BADGE[mp.currentRole.roleType] ?? ""}`}
              >
                {ROLE_LABEL[mp.currentRole.roleType] ?? mp.currentRole.roleType}
              </span>{" "}
              {mp.currentRole.titleLabel}
            </>
          )}
        </div>
      </div>
      <span className="text-sm tabular-nums w-14 text-right">£{mp.price.toFixed(2)}</span>
      <button
        type="button"
        disabled={locked}
        onClick={() => onToggle(mp.id)}
        className={`shrink-0 text-xs px-2.5 py-1 rounded-md border ${
          picked
            ? "bg-emerald-600 text-white border-emerald-600"
            : "border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        } disabled:opacity-50`}
      >
        {picked ? "Picked" : "Add"}
      </button>
    </div>
  );
}
