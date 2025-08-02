import { type } from "arktype";

export const serverScheme = type({
  "NODE_ENV": "'development' | 'production' | 'test' = 'development'",
  "DATABASE_URL": "string",
  "GOOGLE_ID?": "string",
  "GOOGLE_SECRET?": "string",
  "GITHUB_ID?": "string", 
  "GITHUB_SECRET?": "string",
  "DISCORD_CLIENT_ID?": "string",
  "DISCORD_CLIENT_SECRET?": "string",
  "AUTH_SECRET": "string",
  "AUTH_TRUST_HOST?": "string",
  "AUTH_URL": "string",
});

export const clientScheme = type({
  "MODE": "'development' | 'production' | 'test' = 'development'",
  "VITE_AUTH_PATH?": "string",
});
