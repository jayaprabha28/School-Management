import type { Types } from "mongoose";
import { AuditLog } from "../../models/AuditLog.js";

export async function recordAudit(entry: {
  userId?: Types.ObjectId | string | null;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    await AuditLog.create({
      user: entry.userId || null,
      userName: entry.userName || "",
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId || "",
      meta: entry.meta || {},
      ip: entry.ip || "",
    });
  } catch (err) {
    console.error("[audit] failed to record", err);
  }
}
