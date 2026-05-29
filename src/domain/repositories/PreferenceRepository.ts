import { UserPreference } from '../entities/UserPreference';

export interface PreferenceRepository {
  /** Save or overwrite the preferences for a given user */
  save(preference: UserPreference): Promise<void>;

  /** Retrieve preferences for a specific user. Returns null if not found. */
  getByUserId(userId: string): Promise<UserPreference | null>;

  /** Retrieve all stored user preferences (admin analytics) */
  getAll(): Promise<UserPreference[]>;
}
