export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this);
  }
}

export const handleDatabaseError = (error: any): never => {
  if (error.code === "ER_DUP_ENTRY") {
    throw new AppError("Cette ressource existe déjà.", 409);
  }
  if (error.code === "ER_ROW_IS_REFERENCED_2") {
    throw new AppError(
      "Impossible de supprimer cet élément car il est utilisé ailleurs.",
      403,
    );
  }
  if (error.code === "ER_NO_REFERENCED_ROW_2") {
    throw new AppError("L'élément de référence n'existe pas.", 404);
  }
  throw new AppError("Erreur interne de la base de données.", 500);
};