import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  const existing = await db.select().from(users).where(eq(users.name, "Shaukin"));
  if (existing.length > 0) {
    console.log("Super admin Shaukin already exists, skipping seed...");
    return;
  }

  console.log("Seeding super admin user...");
  const pw = await bcrypt.hash("Sapna@12345$$", 10);
  await db.insert(users).values([
    { name: "Shaukin", email: "shaukin@alliancestreet.ae", password: pw, role: "super_admin" as const },
  ]).returning();
  console.log("Super admin Shaukin created successfully!");
}
