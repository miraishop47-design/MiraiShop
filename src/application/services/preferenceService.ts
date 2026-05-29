import { FirebasePreferenceRepositoryImpl } from '../../infrastructure/firebase/FirebasePreferenceRepositoryImpl';
import { UserPreference } from '../../domain/entities/UserPreference';

const repo = new FirebasePreferenceRepositoryImpl();

/**
 * Persist user preferences.
 * Merges current timestamp automatically.
 */
export async function saveUserPreferences(
  userId: string,
  selections: Record<string, string[]>
): Promise<void> {
  const preferences = Object.keys(selections).filter(
    (k) => selections[k].length > 0
  );

  const pref: UserPreference = {
    userId,
    preferences,
    selections,
    updatedAt: new Date().toISOString(),
  };

  await repo.save(pref);
}

/**
 * Load existing preferences for a user.
 * Returns null if the user has never set preferences.
 */
export async function loadUserPreferences(
  userId: string
): Promise<UserPreference | null> {
  return repo.getByUserId(userId);
}

// ─── Admin analytics ──────────────────────────────────────────────────────────

export interface PreferenceStats {
  /** Total number of users who have saved preferences */
  totalUsers: number;

  /** Top-level category counts, sorted descending */
  topCategories: { label: string; count: number }[];

  /** Sub-item counts across all categories, sorted descending */
  topItems: { label: string; category: string; count: number }[];

  /** Recent activity: last 5 users who updated prefs */
  recentActivity: { userId: string; updatedAt: string; categories: string[] }[];
}

/**
 * Aggregate all user preferences into statistics for the admin dashboard.
 */
export async function getPreferenceStats(): Promise<PreferenceStats> {
  const all = await repo.getAll();

  const categoryCount: Record<string, number> = {};
  const itemCount: Record<string, { count: number; category: string }> = {};

  for (const pref of all) {
    // Count top-level categories
    for (const cat of pref.preferences) {
      categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
    }

    // Count individual items
    for (const [cat, items] of Object.entries(pref.selections)) {
      for (const item of items) {
        const key = `${cat}::${item}`;
        if (!itemCount[key]) itemCount[key] = { count: 0, category: cat };
        itemCount[key].count += 1;
      }
    }
  }

  const topCategories = Object.entries(categoryCount)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const topItems = Object.entries(itemCount)
    .map(([key, { count, category }]) => ({
      label: key.split('::')[1],
      category,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const recentActivity = [...all]
    .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
    .slice(0, 5)
    .map((p) => ({
      userId: p.userId,
      updatedAt: p.updatedAt,
      categories: p.preferences,
    }));

  return {
    totalUsers: all.length,
    topCategories,
    topItems,
    recentActivity,
  };
}
