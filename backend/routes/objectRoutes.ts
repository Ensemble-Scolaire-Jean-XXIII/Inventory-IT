import { Router } from "express";
import * as objectService from "../services/objectService";
import { getObjectsByType } from "../services/objectService";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const typeId = req.query.typeId
      ? Number(req.query.typeId)
      : undefined;
    if (typeId) {
      res.json(await getObjectsByType(typeId));
    } else {
      res.json(await objectService.getAllObjects());
    }
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = req.body as {
      object_type_id?: number;
      name?: string;
      data?: Record<string, unknown>;
      count?: number;
    };
    if (!body.object_type_id || !body.name?.trim()) {
      return res
        .status(400)
        .json({ error: "Le type et le nom de l'objet sont requis." });
    }
    const result = await objectService.createObject({
      object_type_id: Number(body.object_type_id),
      name: body.name.trim(),
      data: body.data,
      count: body.count,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const body = req.body as {
      name?: string;
      data?: Record<string, unknown>;
    };
    await objectService.updateObject(Number(req.params.id), body);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await objectService.deleteObject(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;