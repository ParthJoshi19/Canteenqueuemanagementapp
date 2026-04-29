import bcrypt from 'bcrypt';
import { query } from '../config/db.js';

export type UserRole = 'user' | 'admin';

export interface IUser {
  _id: string;
  id: string;
  username: string;
  displayName: string;
  bio: string;
  profilePicture: string;
  profileCompleted: boolean;
  role: UserRole;
  createdAt: Date;
}

interface UserRow {
  _id: string;
  id: string;
  username: string;
  passwordHash?: string;
  displayName: string;
  bio: string;
  profilePicture: string;
  profileCompleted: boolean;
  role: UserRole;
  createdAt: Date;
}

export interface IUserWithPassword extends IUser {
  passwordHash: string;
}

function toUser(row: UserRow): IUser {
  return {
    _id: row._id,
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    bio: row.bio,
    profilePicture: row.profilePicture,
    profileCompleted: row.profileCompleted,
    role: row.role,
    createdAt: row.createdAt,
  };
}

function toUserWithPassword(row: UserRow): IUserWithPassword {
  return {
    ...toUser(row),
    passwordHash: row.passwordHash ?? '',
  };
}

export async function createUser(input: {
  username: string;
  password: string;
  role?: UserRole;
  displayName?: string;
  profileCompleted?: boolean;
}): Promise<IUser> {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const result = await query<UserRow>(
    `INSERT INTO users (username, password_hash, role, display_name, profile_completed)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING
      id AS "_id",
      id,
      username,
      display_name AS "displayName",
      bio,
      profile_picture AS "profilePicture",
      profile_completed AS "profileCompleted",
      role,
      created_at AS "createdAt"`,
    [
      input.username.trim(),
      passwordHash,
      input.role ?? 'user',
      input.displayName ?? '',
      input.profileCompleted ?? false,
    ],
  );

  return toUser(result.rows[0]);
}

export async function findUserByUsername(
  username: string,
  role?: UserRole,
): Promise<IUserWithPassword | null> {
  const hasRole = Boolean(role);
  const result = await query<UserRow>(
    `SELECT
      id AS "_id",
      id,
      username,
      password_hash AS "passwordHash",
      display_name AS "displayName",
      bio,
      profile_picture AS "profilePicture",
      profile_completed AS "profileCompleted",
      role,
      created_at AS "createdAt"
     FROM users
     WHERE username = $1 ${hasRole ? 'AND role = $2' : ''}
     LIMIT 1`,
    hasRole ? [username.trim(), role] : [username.trim()],
  );

  if (result.rows.length === 0) return null;
  return toUserWithPassword(result.rows[0]);
}

export async function findUserById(id: string): Promise<IUser | null> {
  const result = await query<UserRow>(
    `SELECT
      id AS "_id",
      id,
      username,
      display_name AS "displayName",
      bio,
      profile_picture AS "profilePicture",
      profile_completed AS "profileCompleted",
      role,
      created_at AS "createdAt"
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id],
  );

  if (result.rows.length === 0) return null;
  return toUser(result.rows[0]);
}

export async function verifyPassword(user: IUserWithPassword, candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, user.passwordHash);
}

export async function updateUserProfile(
  id: string,
  update: { displayName?: string; bio?: string; profileCompleted?: boolean },
): Promise<IUser | null> {
  const result = await query<UserRow>(
    `UPDATE users
     SET
       display_name = COALESCE($2, display_name),
       bio = COALESCE($3, bio),
       profile_completed = COALESCE($4, profile_completed)
     WHERE id = $1
     RETURNING
      id AS "_id",
      id,
      username,
      display_name AS "displayName",
      bio,
      profile_picture AS "profilePicture",
      profile_completed AS "profileCompleted",
      role,
      created_at AS "createdAt"`,
    [id, update.displayName ?? null, update.bio ?? null, update.profileCompleted ?? null],
  );

  if (result.rows.length === 0) return null;
  return toUser(result.rows[0]);
}

export async function updateUserProfilePicture(id: string, profilePicture: string): Promise<IUser | null> {
  const result = await query<UserRow>(
    `UPDATE users
     SET profile_picture = $2
     WHERE id = $1
     RETURNING
      id AS "_id",
      id,
      username,
      display_name AS "displayName",
      bio,
      profile_picture AS "profilePicture",
      profile_completed AS "profileCompleted",
      role,
      created_at AS "createdAt"`,
    [id, profilePicture],
  );

  if (result.rows.length === 0) return null;
  return toUser(result.rows[0]);
}

export async function findAnyAdmin(): Promise<IUser | null> {
  const result = await query<UserRow>(
    `SELECT
      id AS "_id",
      id,
      username,
      display_name AS "displayName",
      bio,
      profile_picture AS "profilePicture",
      profile_completed AS "profileCompleted",
      role,
      created_at AS "createdAt"
     FROM users
     WHERE role = 'admin'
     ORDER BY created_at ASC
     LIMIT 1`,
  );

  if (result.rows.length === 0) return null;
  return toUser(result.rows[0]);
}
