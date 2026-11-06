import 'dotenv/config';
import path from 'path';

export const AUTH_FILE = path.join(__dirname, '..', '.auth', 'user.json');

// Fail fast with a readable message instead of letting Playwright navigate to "undefined".
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}
