import express from "express";
import { Request, Response, NextFunction } from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import objectTypeRoutes from "./routes/objectTypeRoutes";
import objectFieldRoutes from "./routes/objectFieldRoutes";
import objectRoutes from "./routes/objectRoutes";
import { AppError } from "./utils/appError";

const app = express();
app.disable("x-powered-by");
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/types", objectTypeRoutes);
app.use("/api/fields", objectFieldRoutes);
app.use("/api/objects", objectRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  if (err instanceof SyntaxError) {
    return res.status(400).json({ error: "Requête JSON invalide." });
  }
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});