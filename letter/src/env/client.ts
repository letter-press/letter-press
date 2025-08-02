import type { ArkErrors } from "arktype";
import { clientScheme } from "./schema";

export const formatErrors = (errors: ArkErrors) =>
  errors.map(error => `${error.path.join('.')}: ${error.message}`);

const result = clientScheme(import.meta.env);

if (result instanceof Error) {
  console.error(
    "❌ Invalid environment variables:\n",
    ...formatErrors(result as ArkErrors)
  );
  throw new Error("Invalid environment variables");
}

export const clientEnv = result;
