import { Schema, model, type HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";

export type UserType = "staff" | "student" | "parent";

export interface UserDoc {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  type: UserType;
  studentRef?: Schema.Types.ObjectId | null;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: Date | null;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, index: true },
    type: { type: String, enum: ["staff", "student", "parent"], default: "staff" },
    studentRef: { type: Schema.Types.ObjectId, ref: "EntityRecord", default: null },
    phone: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: unknown, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

userSchema.methods.comparePassword = function (this: HydratedDocument<UserDoc>, candidate: string) {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = model<UserDoc>("User", userSchema);

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
