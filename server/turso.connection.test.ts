import { createClient } from "@libsql/client";
import { describe, expect, it } from "vitest";
import { verifyMailTransport } from "./mailer";

describe("Turso connection configuration", () => {
  it("accepts the supplied database URL and token for a read-only query", async () => {
    const databaseUrl = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    expect(databaseUrl).toMatch(/^libsql:\/\//);
    expect(authToken).toBeTruthy();

    const client = createClient({ url: databaseUrl!, authToken });
    const result = await client.execute("SELECT 1 AS healthy");
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.healthy).toBe(1);
    client.close();
  });
});

describe("SMTP configuration", () => {
  it("exposes the required protected sender settings", async () => {
    expect(process.env.SMTP_HOST).toBe("smtp.gmail.com");
    expect(process.env.SMTP_PORT).toBe("465");
    expect(process.env.SMTP_SECURE).toBe("true");
    expect(process.env.SMTP_USER).toContain("@");
    expect(process.env.SMTP_PASSWORD).toBeTruthy();
    expect(process.env.FROM_EMAIL).toContain("royaleditmediahouse@gmail.com");
    await expect(verifyMailTransport()).resolves.toBe(true);
  });
});

export {};
void 0;
// The empty export keeps this file a module in TypeScript isolated compilation mode.
; 
