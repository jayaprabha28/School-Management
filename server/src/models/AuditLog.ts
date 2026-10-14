import { Schema, model, type Types } from "mongoose";

export interface AuditLogDoc {
  user?: Types.ObjectId | null;
  userName?: string;
  action: string;
  resource: string;
  resourceId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}

const auditLogSchema = new Schema<AuditLogDoc>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    userName: { type: String, default: "" },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
  },
  { timestamps: true },
);

export const AuditLog = model<AuditLogDoc>("AuditLog", auditLogSchema);
