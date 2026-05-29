export interface UserPreference {
  userId: string;
  preferences: string[]; // Flat list of category labels selected (e.g. ["Gaming", "Hogar"])
  selections: Record<string, string[]>; // Complete breakdown mapping category ID to detailed item selections
  updatedAt: string;
}
