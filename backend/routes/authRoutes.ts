import { Router } from "express";
import * as authService from "../services/authService";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };
    if (!email?.trim() || !password) {
      return res.status(400).json({
        error: "Une adresse e-mail et un mot de passe sont requis.",
      });
    }
    const result = await authService.login(email.trim().toLowerCase(), password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await authService.getUserById((req as any).user.id);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put("/profile", authenticate, async (req, res, next) => {
  try {
    const { email } = req.body as { email?: string };
    const normalized = email?.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return res.status(400).json({ error: "Adresse e-mail invalide." });
    }
    const user = await authService.updateEmail((req as any).user.id, normalized);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put("/password", authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Le mot de passe actuel et le nouveau sont requis." });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Le nouveau mot de passe doit contenir au moins 6 caractères." });
    }
    await authService.changePassword(
      (req as any).user.id,
      currentPassword,
      newPassword,
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;