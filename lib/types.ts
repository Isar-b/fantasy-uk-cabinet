export type Tier = "S" | "A" | "B" | "C" | "D" | "E";

export type RoleType = "pm" | "great_office" | "cabinet" | "attending" | "none";

export type MP = {
  id: string;
  name: string;
  constituency: string;
  party: string;
  tier: Tier;
  price: number;
  photoUrl?: string;
  active: boolean;
};

export type RoleAssignment = {
  mpId: string;
  roleType: Exclude<RoleType, "none">;
  titleLabel: string;
  startDate: string;
  endDate: string | null;
};

export type KnownRole = {
  titleLabel: string;
  roleType: Exclude<RoleType, "none">;
};

export type Pick = {
  mpId: string;
  predictedRole?: string;
};

export type Cabinet = {
  userId: string;
  picks: Pick[];
  totalCost: number;
  updatedAt: string;
};

export type League = {
  id: string;
  name: string;
  ownerId: string;
  joinCode: string;
  memberIds: string[];
  createdAt: string;
};

export type User = {
  id: string;
  displayName: string;
  email?: string;
  createdAt: string;
};

export type Settings = {
  freezeAll: boolean;
  swapDeadline: string;
  scoringDate: string;
};
