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

const TIER_TAG: Record<Tier, string> = {
  S: "bg-[#4c2c92] text-white",
  A: "bg-[#d4351c] text-white",
  B: "bg-[#f47738] text-white",
  C: "bg-[#00703c] text-white",
  D: "bg-[#1d70b8] text-white",
  E: "bg-[#505a5f] text-white",
};

const ROLE_TAG: Record<string, string> = {
  pm: "bg-[#fd0] text-[#0b0c0c]",
  great_office: "bg-[#d4351c] text-white",
  cabinet: "bg-[#f47738] text-white",
  attending: "bg-[#00703c] text-white",
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
    new Set(["S", "A", "B", "C", "D"])
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
        setMessage({ kind: "ok", text: `Saved. Total spend: £${res.totalCost.toFixed(2)}` });
      } else {
        setMessage({ kind: "err", text: res.error });
      }
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
      <aside className="lg:sticky lg:top-4 lg:self-start space-y-4">
        {locked && (
          <div className="border-l-[10px] border-[#0b0c0c] pl-4 py-3">
            <p className="text-base font-bold">Squads locked — read-only</p>
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold mb-2">Budget</h2>
          <div className="border border-[#b1b4b6] p-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm text-[#505a5f] uppercase font-bold tracking-wide">
                Spent
              </span>
              <span className={`text-2xl font-bold tabular-nums ${overBudget ? "text-[#d4351c]" : "text-[#0b0c0c]"}`}>
                £{totalCost.toFixed(2)}
              </span>
            </div>
            <div className="h-2 bg-[#f3f2f1] overflow-hidden">
              <div
                className={overBudget ? "bg-[#d4351c] h-full" : "bg-[#00703c] h-full"}
                style={{ width: `${Math.min(100, (totalCost / 100) * 100)}%` }}
              />
            </div>
            <div className="text-sm text-[#505a5f] mt-2">
              {overBudget
                ? `Over by £${(totalCost - 100).toFixed(2)}`
                : `£${remaining.toFixed(2)} remaining`}{" "}
              · {picks.length}/10 picked
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">Your squad</h2>
          <ul className="border border-[#b1b4b6] divide-y divide-[#b1b4b6]">
            {Array.from({ length: 10 }).map((_, i) => {
              const pick = picks[i];
              const mp = pick ? mpById.get(pick.mpId) : null;
              return (
                <li key={i} className="px-3 py-2 text-sm">
                  {mp ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`govuk-tag ${TIER_TAG[mp.tier]}`}>
                              {mp.tier}
                            </span>
                            <span className="truncate font-bold text-[#0b0c0c]">{mp.name}</span>
                          </div>
                          <div className="text-xs text-[#505a5f] truncate">
                            {mp.constituency}
                          </div>
                        </div>
                        <span className="text-base font-bold tabular-nums whitespace-nowrap">£{mp.price.toFixed(2)}</span>
                        {!locked && (
                          <button
                            type="button"
                            onClick={() => togglePick(mp.id)}
                            className="text-[#1d70b8] hover:text-[#d4351c] underline text-sm shrink-0"
                            aria-label={`Remove ${mp.name}`}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <select
                        disabled={locked}
                        value={pick.predictedRole ?? ""}
                        onChange={(e) => setPredicted(mp.id, e.target.value)}
                        className="govuk-select text-sm"
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
                    <span className="text-[#505a5f] italic">Slot {i + 1} empty</span>
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
          className="govuk-button w-full"
        >
          {isPending ? "Saving…" : "Save squad"}
        </button>
        {message && (
          <div
            className={`border-l-[10px] pl-4 py-3 ${
              message.kind === "ok"
                ? "border-[#00703c]"
                : "border-[#d4351c]"
            }`}
          >
            <p
              className={`text-base font-bold ${
                message.kind === "ok" ? "text-[#00703c]" : "text-[#d4351c]"
              }`}
            >
              {message.text}
            </p>
          </div>
        )}
      </aside>

      <section>
        <h1 className="text-3xl font-bold mb-4 text-[#0b0c0c]">Pick your cabinet</h1>
        <div className="space-y-3 mb-4">
          <label className="block">
            <span className="text-base font-bold text-[#0b0c0c]">Search</span>
            <input
              type="search"
              placeholder="Name or constituency"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="govuk-input mt-1"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {TIER_ORDER.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTier(t)}
                className={`text-sm px-3 py-1 border-2 transition-colors ${
                  tierFilter.has(t)
                    ? `${TIER_TAG[t]} border-transparent`
                    : "border-[#0b0c0c] text-[#0b0c0c] bg-white"
                }`}
              >
                Tier {t}
              </button>
            ))}
            <label className="ml-2 text-base flex items-center gap-2 select-none">
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
              className="govuk-select ml-auto text-sm w-auto"
            >
              <option value="price">Sort: price</option>
              <option value="name">Sort: name</option>
              <option value="tier">Sort: tier</option>
            </select>
          </div>
          <div className="text-sm text-[#505a5f]">
            {visibleMPs.length} MP{visibleMPs.length === 1 ? "" : "s"} shown
          </div>
        </div>

        <div className="border border-[#b1b4b6]">
          <List<MPRowProps>
            rowComponent={MPRow}
            rowCount={visibleMPs.length}
            rowHeight={68}
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
      className={`px-4 py-3 border-b border-[#b1b4b6] flex items-center gap-3 ${
        picked ? "bg-[#f3f2f1]" : ""
      }`}
    >
      <span className={`govuk-tag ${TIER_TAG[mp.tier]} shrink-0 w-6 text-center`}>
        {mp.tier}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-base font-bold truncate text-[#0b0c0c]">{mp.name}</div>
        <div className="text-sm text-[#505a5f] truncate">
          {mp.constituency}
          {mp.currentRole && (
            <>
              {" · "}
              <span
                className={`govuk-tag ${ROLE_TAG[mp.currentRole.roleType] ?? ""} text-[10px]`}
              >
                {ROLE_LABEL[mp.currentRole.roleType] ?? mp.currentRole.roleType}
              </span>{" "}
              {mp.currentRole.titleLabel}
            </>
          )}
        </div>
      </div>
      <span className="text-base font-bold tabular-nums w-16 text-right">£{mp.price.toFixed(2)}</span>
      <button
        type="button"
        disabled={locked}
        onClick={() => onToggle(mp.id)}
        className={`shrink-0 ${
          picked
            ? "govuk-button govuk-button--secondary"
            : "govuk-button"
        }`}
      >
        {picked ? "Picked" : "Add"}
      </button>
    </div>
  );
}
