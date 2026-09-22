import { pool } from "../config/db";
import { User } from "../models/types";
import { AppError, handleDatabaseError } from "../utils/appError";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

const signToken = (user: User): string =>
  jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
    expiresIn: "30d",
  });

export const login = async (
  email: string,
  password: string,
): Promise<{ token: string; user: Omit<User, "password_hash"> }> => {
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
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
      "SELECT id, first_name, last_name, email, created_at FROM users WHERE id = ?",
      [id],
    );
    return rows[0] || null;
  } catch (error: any) {
    throw handleDatabaseError(error);
  }
};

export const listUsers = async (): Promise<
  Omit<User, "password_hash">[]
> => {
  try {
    const [rows]: any = await pool.query(
      "SELECT id, first_name, last_name, email, created_at FROM users ORDER BY last_name, first_name, created_at",
    );
    return rows;
  } catch (error: any) {
    throw handleDatabaseError(error);
  }
};

export const createUser = async (
  email: string,
  password: string,
  first_name?: string | null,
  last_name?: string | null,
): Promise<string> => {
  try {
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (id, email, first_name, last_name, password_hash) VALUES (?, ?, ?, ?, ?)",
      [id, email, first_name || null, last_name || null, passwordHash],
    );
    return id;
  } catch (error: any) {
    throw handleDatabaseError(error);
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    const [result]: any = await pool.query(
      "DELETE FROM users WHERE id = ?",
      [id],
    );
    if (result.affectedRows === 0) {
      throw new AppError("Utilisateur introuvable.", 404);
    }
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw handleDatabaseError(error);
  }
};

export const updateEmail = async (
  id: string,
  email: string,
): Promise<Omit<User, "password_hash">> => {
  try {
    const [existing]: any = await pool.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, id],
    );
    if (existing.length > 0) {
      throw new AppError("Cet e-mail est déjà utilisé.", 409);
    }
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
  email: user.email,
  first_name: user.first_name,
  last_name: user.last_name,
  created_at: user.created_at,
});