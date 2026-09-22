import { Router } from "express";
import * as objectFieldService from "../services/objectFieldService";
import { authenticate } from "../middleware/auth";
import { FieldInputType } from "../models/types";

const router = Router();

router.use(authenticate);

router.put("/:id", async (req, res, next) => {
  try {
    const body = req.body as {
      label?: string;
      field_key?: string;
      input_type?: FieldInputType;
      options?: string[];
      is_required?: boolean;
      sort_order?: number;
    };

    if (body.input_type !== undefined) {
      if (
        !["text", "number", "date", "mac", "ip", "select", "boolean"].includes(
          body.input_type,
        )
      ) {
        return res.status(400).json({ error: "Type de champ invalide." });
      }
    }

    await objectFieldService.updateField(Number(req.params.id), body);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await objectFieldService.deleteField(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;