import { Schema, model, type Types } from "mongoose";

export interface EntityRecordDoc {
  module: string;
  submenu: string;
  data: Record<string, unknown>;
  owner?: Types.ObjectId | null;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const entityRecordSchema = new Schema<EntityRecordDoc>(
  {
    module: { type: String, required: true, index: true },
    submenu: { type: String, required: true, index: true },
    data: { type: Schema.Types.Mixed, default: {} },
    owner: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, minimize: false },
);

entityRecordSchema.index({ module: 1, submenu: 1, isDeleted: 1 });
entityRecordSchema.index({ "data.student": 1 });

export const EntityRecord = model<EntityRecordDoc>("EntityRecord", entityRecordSchema);
