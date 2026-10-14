import type { NextFunction, Request, Response } from "express";
import type { PermissionAction } from "../platform/catalog.js";
import { findSubmenu } from "../platform/catalog.js";
import { ApiError } from "./error.js";
import type { AuthContext } from "./auth.js";

export function hasPermission(auth: AuthContext | undefined, groupShortCode: string, action: PermissionAction): boolean {
  if (!auth) return false;
  if (auth.isAdmin) return true;
  const actions = auth.groups.get(groupShortCode);
  if (!actions) return false;
  // "edit" implies nothing more; "delete"/"approve"/"export"/"create" are explicit.
  return actions.has(action);
}

export function canAccessSubmenu(auth: AuthContext | undefined, submenuShortCode: string, action: PermissionAction = "view") {
  if (!auth) return false;
  if (auth.isAdmin) return true;
  const found = findSubmenu(submenuShortCode);
  if (!found) return false;
  if (found.module.isStudentPanel) {
    return auth.studentPanel.has(submenuShortCode);
  }
  return hasPermission(auth, found.module.shortCode, action);
}

export function requirePermission(groupShortCode: string, action: PermissionAction) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(ApiError.unauthorized());
    if (!hasPermission(req.auth, groupShortCode, action)) {
      return next(ApiError.forbidden(`Missing permission ${groupShortCode}:${action}`));
    }
    next();
  };
}

export function requireSubmenuPermission(action: PermissionAction) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(ApiError.unauthorized());
    const submenu = String(req.params.submenu);
    if (!canAccessSubmenu(req.auth, submenu, action)) {
      return next(ApiError.forbidden(`Missing permission for ${submenu}:${action}`));
    }
    next();
  };
}
