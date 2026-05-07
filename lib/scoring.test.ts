import { describe, it, expect } from "vitest";
import { score } from "./scoring";
import type { RoleAssignment } from "./types";

const ON = new Date("2026-07-01T00:00:00Z");
const start = "2026-01-01";

const roles: RoleAssignment[] = [
  { mpId: "starmer", roleType: "pm", titleLabel: "Prime Minister", startDate: start, endDate: null },
  { mpId: "reeves", roleType: "great_office", titleLabel: "Chancellor of the Exchequer", startDate: start, endDate: null },
  { mpId: "cooper", roleType: "great_office", titleLabel: "Foreign Secretary", startDate: start, endDate: null },
  { mpId: "streeting", roleType: "cabinet", titleLabel: "Health and Social Care Secretary", startDate: start, endDate: null },
  { mpId: "dodds", roleType: "attending", titleLabel: "Minister of State for Development", startDate: start, endDate: null },
];

describe("scoring — base points", () => {
  it("PM is 5", () => {
    const r = score({ picks: [{ mpId: "starmer" }] }, roles, ON);
    expect(r.totalPoints).toBe(5);
    expect(r.perMP[0].basePoints).toBe(5);
    expect(r.perMP[0].bonusPoints).toBe(0);
  });
  it("great office is 3", () => {
    const r = score({ picks: [{ mpId: "reeves" }] }, roles, ON);
    expect(r.totalPoints).toBe(3);
  });
  it("cabinet is 2", () => {
    const r = score({ picks: [{ mpId: "streeting" }] }, roles, ON);
    expect(r.totalPoints).toBe(2);
  });
  it("attending is 1", () => {
    const r = score({ picks: [{ mpId: "dodds" }] }, roles, ON);
    expect(r.totalPoints).toBe(1);
  });
  it("backbench is 0", () => {
    const r = score({ picks: [{ mpId: "nobody" }] }, roles, ON);
    expect(r.totalPoints).toBe(0);
    expect(r.perMP[0].roleType).toBe("none");
  });
});

describe("scoring — exact-role prediction bonus", () => {
  it("correct PM prediction adds +3", () => {
    const r = score(
      { picks: [{ mpId: "starmer", predictedRole: "Prime Minister" }] },
      roles,
      ON
    );
    expect(r.totalPoints).toBe(8); // 5 + 3
    expect(r.perMP[0].predictionHit).toBe(true);
    expect(r.perMP[0].bonusPoints).toBe(3);
  });
  it("correct great-office prediction adds +2", () => {
    const r = score(
      {
        picks: [
          { mpId: "reeves", predictedRole: "Chancellor of the Exchequer" },
        ],
      },
      roles,
      ON
    );
    expect(r.totalPoints).toBe(5); // 3 + 2
  });
  it("correct cabinet prediction adds +1", () => {
    const r = score(
      {
        picks: [
          {
            mpId: "streeting",
            predictedRole: "Health and Social Care Secretary",
          },
        ],
      },
      roles,
      ON
    );
    expect(r.totalPoints).toBe(3); // 2 + 1
  });
  it("attending prediction adds 0", () => {
    const r = score(
      {
        picks: [
          { mpId: "dodds", predictedRole: "Minister of State for Development" },
        ],
      },
      roles,
      ON
    );
    expect(r.totalPoints).toBe(1); // 1 + 0
  });
  it("wrong portfolio in same tier — no bonus", () => {
    const r = score(
      {
        picks: [
          { mpId: "reeves", predictedRole: "Foreign Secretary" }, // she's Chancellor
        ],
      },
      roles,
      ON
    );
    expect(r.totalPoints).toBe(3); // 3 base, 0 bonus
    expect(r.perMP[0].predictionHit).toBe(false);
  });
  it("right person, wrong tier prediction — no bonus, base unchanged", () => {
    const r = score(
      {
        picks: [
          { mpId: "starmer", predictedRole: "Chancellor of the Exchequer" },
        ],
      },
      roles,
      ON
    );
    expect(r.totalPoints).toBe(5);
  });
  it("prediction is case-insensitive", () => {
    const r = score(
      {
        picks: [
          {
            mpId: "reeves",
            predictedRole: "chancellor of the exchequer  ",
          },
        ],
      },
      roles,
      ON
    );
    expect(r.totalPoints).toBe(5);
  });
});

describe("scoring — mixed squad", () => {
  it("sums correctly across a varied squad", () => {
    const r = score(
      {
        picks: [
          { mpId: "starmer", predictedRole: "Prime Minister" }, // 5+3
          { mpId: "reeves" }, // 3
          { mpId: "cooper", predictedRole: "Home Secretary" }, // 3 (wrong portfolio)
          { mpId: "streeting", predictedRole: "Health and Social Care Secretary" }, // 2+1
          { mpId: "dodds" }, // 1
          { mpId: "nobody1" }, // 0
          { mpId: "nobody2" }, // 0
          { mpId: "nobody3" }, // 0
          { mpId: "nobody4" }, // 0
          { mpId: "nobody5" }, // 0
        ],
      },
      roles,
      ON
    );
    expect(r.totalPoints).toBe(8 + 3 + 3 + 3 + 1);
    expect(r.perMP).toHaveLength(10);
  });
});

describe("scoring — date-aware role lookup", () => {
  it("ignores assignments that end before snapshot", () => {
    const ended: RoleAssignment[] = [
      { mpId: "x", roleType: "great_office", titleLabel: "Chancellor of the Exchequer", startDate: "2026-01-01", endDate: "2026-04-01" },
    ];
    const r = score({ picks: [{ mpId: "x" }] }, ended, ON);
    expect(r.totalPoints).toBe(0);
  });
  it("ignores assignments that start after snapshot", () => {
    const future: RoleAssignment[] = [
      { mpId: "x", roleType: "pm", titleLabel: "Prime Minister", startDate: "2026-08-01", endDate: null },
    ];
    const r = score({ picks: [{ mpId: "x" }] }, future, ON);
    expect(r.totalPoints).toBe(0);
  });
  it("counts active assignment on snapshot day", () => {
    const active: RoleAssignment[] = [
      { mpId: "x", roleType: "pm", titleLabel: "Prime Minister", startDate: "2026-06-01", endDate: null },
    ];
    const r = score({ picks: [{ mpId: "x" }] }, active, ON);
    expect(r.totalPoints).toBe(5);
  });
});
