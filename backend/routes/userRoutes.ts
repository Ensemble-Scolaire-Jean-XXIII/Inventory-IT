import { Router } from "express";
import * as authService from "../services/authService";
import { sendMail } from "../services/mailService";
import { generateTemporaryPassword } from "../utils/password";
import { authenticate } from "../middleware/auth";
import { AppError } from "../utils/appError";

const router = Router();

const isEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    res.json(await authService.listUsers());
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { email, first_name, last_name } = req.body as {
      email?: string;
      first_name?: string;
      last_name?: string;
    };
    const normalized = email?.trim().toLowerCase();
    if (!normalized || !isEmail(normalized)) {
      return res.status(400).json({ error: "Adresse e-mail invalide." });
    }
    const firstName = first_name?.trim().slice(0, 100) || null;
    const lastName = last_name?.trim().slice(0, 100) || null;
    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ error: "Le prénom et le nom sont requis." });
    }

    const temporaryPassword = generateTemporaryPassword();
    const id = await authService.createUser(
      normalized,
      temporaryPassword,
      firstName,
      lastName,
    );

    const displayName =
      `${firstName} ${lastName}`.trim() || normalized;
    const sent = await sendMail(
      normalized,
      "Création de votre compte Inventory-IT",
      `Bonjour ${firstName},\n\nUn compte a été créé pour vous sur l'inventaire informatique Jean-XXIII.\nAccédez ici : ${process.env.FRONTEND_URL}\n\nE-mail : ${normalized}\nMot de passe temporaire : ${temporaryPassword}`,
      `<div style="font-family: sans-serif; color: #333; line-height: 1.4;">Bonjour <strong>${firstName}</strong>,<br><br>Un administrateur vient de vous créer un compte sur l'inventaire informatique Jean-XXIII.<br>Vous pouvez vous connecter dès maintenant en cliquant sur ce lien : <a href="${process.env.FRONTEND_URL}">Accéder à l'inventaire</a>.<br><br>Voici vos identifiants de connexion temporaires :<ul style="margin-top: 5px;"><li><strong>E-mail :</strong> ${normalized}</li><li><strong>Mot de passe temporaire :</strong> ${temporaryPassword}</li></ul><p style="color: #b45309; font-weight: 600;">Nous vous recommandons fortement de changer ce mot de passe dès votre première connexion.</p></div>`,
    );

    const payload = { id, name: displayName, email: normalized };
    res.status(201).json(sent ? payload : { ...payload, temporaryPassword });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (req.params.id === (req as any).user.id) {
      throw new AppError(
        "Impossible de supprimer votre propre compte.",
        400,
      );
    }
    await authService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;