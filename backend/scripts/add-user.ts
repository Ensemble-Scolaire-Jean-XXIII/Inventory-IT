import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../config/db";

async function main(): Promise<number> {
  const [usernameRaw, passwordRaw] = process.argv.slice(2);

  if (!usernameRaw?.trim() || !passwordRaw) {
    console.error("Usage : npx tsx scripts/add-user.ts <username> <password>");
    return 1;
  }

  const username = usernameRaw.trim();

  const [existing]: any = await pool.query(
    "SELECT id FROM users WHERE username = ?",
    [username],
  );
  if (existing.length > 0) {
    console.error(`L'utilisateur « ${username} » existe déjà.`);
    return 1;
  }

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(passwordRaw, 10);
  await pool.query(
    "INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)",
    [id, username, passwordHash],
  );
  console.log(`Utilisateur « ${username} » créé.`);
  return 0;
}

main()
  .then(async (code) => {
    await pool.end();
    process.exit(code);
  })
  .catch(async (error) => {
    console.error("Erreur lors de la création de l'utilisateur :", error);
    await pool.end();
    process.exit(1);
  });