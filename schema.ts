import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const qrScans = pgTable("qr_scans", {
  id: serial("id").primaryKey(),
  data: text("data").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  deviceInfo: text("device_info"),
  success: boolean("success").default(true).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertQrScanSchema = createInsertSchema(qrScans).pick({
  data: true,
  deviceInfo: true,
  success: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertQrScan = z.infer<typeof insertQrScanSchema>;
export type QrScan = typeof qrScans.$inferSelect;
