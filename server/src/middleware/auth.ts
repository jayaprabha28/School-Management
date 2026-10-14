import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User, type UserDoc } from "../models/User.js";
import { Role, type RoleDoc } from "../models/Role.js";
import { ApiError } from "./error.js";
import type { HydratedDocument } from "mongoose";

export interface AuthContext {
  id: string;
  name: string;
  email: string;
  type: string;
  role: string;
  isAdmin: boolean;
  groups: Map<string, Set<string>>;
  studentPanel: Set<string>;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}

export function buildAuthContext(user: HydratedDocument<UserDoc>, role: RoleDoc | null): AuthContext {
  const groups = new Map<string, Set<string>>();
  if (role) {
    for (const group of role.groups) {
      groups.set(group.shortCode, new Set(group.actions));
    }
  }
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    type: user.type,
    role: user.role,
    isAdmin: Boolean(role?.isAdmin),
    groups,
    studentPanel: new Set(role?.studentPanel ?? []),
  };
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw ApiError.unauthorized("Missing bearer token");
    }
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;
    } catch {
      throw ApiError.unauthorized("Invalid or expired token");
    }
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized("Account not found or inactive");
    }
    const role = await Role.findOne({ name: user.role });
    req.auth = buildAuthContext(user, role);
    next();
  } catch (err) {
    next(err);
  }
}
