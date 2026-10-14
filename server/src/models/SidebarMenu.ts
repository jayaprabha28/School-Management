import { Schema, model } from "mongoose";

export interface SidebarMenuDoc {
  shortCode: string;
  label: string;
  icon: string;
  order: number;
  isAddon: boolean;
  isStudentPanel: boolean;
  enabled: boolean;
  permissionGroup: string;
}

const sidebarMenuSchema = new Schema<SidebarMenuDoc>(
  {
    shortCode: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true },
    icon: { type: String, default: "Circle" },
    order: { type: Number, default: 0 },
    isAddon: { type: Boolean, default: false },
    isStudentPanel: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    permissionGroup: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

export const SidebarMenu = model<SidebarMenuDoc>("SidebarMenu", sidebarMenuSchema);
