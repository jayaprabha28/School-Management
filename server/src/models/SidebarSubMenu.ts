import { Schema, model } from "mongoose";

export interface SidebarSubMenuDoc {
  shortCode: string;
  label: string;
  moduleShortCode: string;
  order: number;
  permissionGroup: string;
  enabled: boolean;
}

const sidebarSubMenuSchema = new Schema<SidebarSubMenuDoc>(
  {
    shortCode: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true },
    moduleShortCode: { type: String, required: true, index: true },
    order: { type: Number, default: 0 },
    permissionGroup: { type: String, required: true, index: true },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const SidebarSubMenu = model<SidebarSubMenuDoc>("SidebarSubMenu", sidebarSubMenuSchema);
