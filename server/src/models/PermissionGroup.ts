import { Schema, model, type InferSchemaType } from "mongoose";

const permissionGroupSchema = new Schema(
  {
    shortCode: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true },
    actions: { type: [String], default: ["view"] },
    isStudentPanel: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type PermissionGroupDoc = InferSchemaType<typeof permissionGroupSchema>;
export const PermissionGroup = model("PermissionGroup", permissionGroupSchema);
