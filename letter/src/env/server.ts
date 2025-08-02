import { isServer } from "solid-js/web";
import { serverScheme } from "./schema";
import { ArkErrors } from "arktype";

export const formatErrors = (errors: ArkErrors) =>
  errors.map(error => `${error.path.join('.')}: ${error.message}`);

let result: any = {};

if (isServer) {
  result = serverScheme(process.env);
  
  if (result instanceof ArkErrors) {
    console.error(
      "❌ Invalid environment variables:\n",
      ...formatErrors(result),
      "\n\nPlease check your .env file or environment configuration.",
      "\n\nCurrent environment variables:\n",
      JSON.stringify(process.env, null, 2)
    );
  }
}

export const serverEnv = isServer ? result : {};
