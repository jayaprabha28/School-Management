import { Schema, model } from "mongoose";

export interface SettingDoc {
  key: string;
  value: unknown;
}

const settingSchema = new Schema<SettingDoc>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, minimize: false },
);

export const Setting = model<SettingDoc>("Setting", settingSchema);
