import { Schema, model } from "mongoose";

export interface RoleGroup {
  shortCode: string;
  actions: string[];
}

export interface RoleDoc {
  name: string;
  description?: string;
  isAdmin: boolean;
  isSystem: boolean;
  groups: RoleGroup[];
  studentPanel: string[];
}

const roleSchema = new Schema<RoleDoc>(
  {
    name: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    isAdmin: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false },
    groups: [
      {
        _id: false,
        shortCode: { type: String, required: true },
        actions: { type: [String], default: ["view"] },
      },
    ],
    studentPanel: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const Role = model<RoleDoc>("Role", roleSchema);
