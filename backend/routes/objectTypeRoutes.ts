import { Router } from "express";
import * as objectTypeService from "../services/objectTypeService";
import * as objectFieldService from "../services/objectFieldService";
import * as objectService from "../services/objectService";
import { authenticate } from "../middleware/auth";
import { FieldInputType } from "../models/types";
import { AppError } from "../utils/appError";

const router = Router();

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    res.json(await objectTypeService.getAllTypesWithFields());
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, sort_order } = req.body as {
      name?: string;
      sort_order?: number;
    };
    if (!name?.trim()) {
      return res
        .status(400)
        .json({ error: "Un nom de type d'objet est requis." });
    }
    const id = await objectTypeService.createType(name, sort_order);
    res.status(201).json({ id });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/fields", async (req, res, next) => {
  try {
    const typeId = Number(req.params.id);
    const body = req.body as {
      label?: string;
      field_key?: string;
      input_type?: FieldInputType;
      options?: string[];
      is_required?: boolean;
      sort_order?: number;
    };

    if (!body.label?.trim() || !body.field_key?.trim()) {
      return res
        .status(400)
        .json({ error: "Un libellé et une clé de champ sont requis." });
    }
    if (
      !["text", "number", "date", "mac", "ip", "select", "boolean"].includes(
        body.input_type || "",
      )
    ) {
      return res.status(400).json({ error: "Type de champ invalide." });
    }

    const type = await objectTypeService.getTypeById(typeId);
    if (!type) {
      throw new AppError("Type d'objet introuvable.", 404);
    }

    const id = await objectFieldService.addField({
      object_type_id: typeId,
      label: body.label,
      field_key: body.field_key,
      input_type: body.input_type as FieldInputType,
      options: body.options,
      is_required: body.is_required,
      sort_order: body.sort_order,
    });
    res.status(201).json({ id });
  } catch (error) {
    next(error);
  }
});

router.put("/:id/fields/reorder", async (req, res, next) => {
  try {
    const typeId = Number(req.params.id);
    const { ids } = req.body as { ids?: unknown };
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      !ids.every((v) => typeof v === "number")
    ) {
      return res
        .status(400)
        .json({ error: "Une liste d'identifiants est requise." });
    }
    await objectFieldService.reorderFields(typeId, ids as number[]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.put("/reorder", async (req, res, next) => {
  try {
    const { ids } = req.body as { ids?: unknown };
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      !ids.every((v) => typeof v === "number")
    ) {
      return res
        .status(400)
        .json({ error: "Une liste d'identifiants est requise." });
    }
    await objectTypeService.reorderTypes(ids as number[]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { name, sort_order } = req.body as {
      name?: string;
      sort_order?: number;
    };
    await objectTypeService.updateType(Number(req.params.id), {
      name,
      sort_order,
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await objectTypeService.deleteType(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;