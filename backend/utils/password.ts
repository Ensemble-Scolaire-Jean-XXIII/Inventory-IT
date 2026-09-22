import { randomBytes } from "node:crypto";

export const generateTemporaryPassword = (): string => {
  const groups = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "@$!%*#?&",
  ];
  const required = groups.map((g) => g[Math.floor(Math.random() * g.length)]);
  const allChars = groups.join("");
  const length = 16 + Math.floor(Math.random() * 4);
  const rest = Array.from(randomBytes(length - required.length)).map(
    (b) => allChars[b % allChars.length],
  );
  const all = [...required, ...rest];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.join("");
};