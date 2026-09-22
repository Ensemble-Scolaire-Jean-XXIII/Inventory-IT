import { pool } from "../config/db";
import { User } from "../models/types";
import { AppError, handleDatabaseError } from "../utils/appError";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const signToken = (user: User): string =>
  jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET as string,
    { expiresIn: "30d" },
  );

export const login = async (
  username: string,
  password: string,
): Promise<{ token: string; user: Omit<User, "password_hash"> }> => {
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username],
    );
    const user = rows[0] as User | undefined;

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError("Identifiants incorrects.", 401);
    }

    return { token: signToken(user), user: toSafeUser(user) };
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw handleDatabaseError(error);
  }
};

export const getUserById = async (
  id: string,
): Promise<Omit<User, "password_hash"> | null> => {
  try {
    const [rows]: any = await pool.query(
      "SELECT id, username, email, created_at FROM users WHERE id = ?",
      [id],
    );
    return rows[0] || null;
  } catch (error: any) {
    throw handleDatabaseError(error);
  }
};

export const updateEmail = async (
  id: string,
  email: string | null,
): Promise<Omit<User, "password_hash">> => {
  try {
    await pool.query("UPDATE users SET email = ? WHERE id = ?", [email, id]);
    const user = await getUserById(id);
    if (!user) {
      throw new AppError("Utilisateur introuvable.", 404);
    }
    return user;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw handleDatabaseError(error);
  }
};

export const changePassword = async (
  id: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  try {
    const [rows]: any = await pool.query(
      "SELECT password_hash FROM users WHERE id = ?",
      [id],
    );
    const user = rows[0] as { password_hash: string } | undefined;
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
      throw new AppError("Mot de passe actuel incorrect.", 400);
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      passwordHash,
      id,
    ]);
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw handleDatabaseError(error);
  }
};

const toSafeUser = (user: User): Omit<User, "password_hash"> => ({
  id: user.id,
  username: user.username,
  email: user.email,
  created_at: user.created_at,
});