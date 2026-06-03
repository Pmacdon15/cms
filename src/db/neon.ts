import { neon } from "@neondatabase/serverless";

// Load environment connection string
const connectionString = process.env.DATABASE_URL;

/**
 * Executes a PostgreSQL raw SQL query using Neon DB Serverless.
 * If DATABASE_URL is missing, it raises an error that the DAL will catch.
 */
export const sql = (() => {
  if (!connectionString) {
    return async (
      _strings: TemplateStringsArray,
      ..._values: unknown[]
    ): Promise<unknown> => {
      throw new Error(
        "DATABASE_URL environment variable is missing. Please configure it in your .env.local file to connect to Neon DB.",
      );
    };
  }
  return neon(connectionString);
})();
