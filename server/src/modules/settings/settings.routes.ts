import { Router } from "express";
import { z } from "zod";
import { SidebarMenu } from "../../models/SidebarMenu.js";
import { SidebarSubMenu } from "../../models/SidebarSubMenu.js";
import { PermissionGroup } from "../../models/PermissionGroup.js";
import { Role } from "../../models/Role.js";
import { User, hashPassword } from "../../models/User.js";
import { AuditLog } from "../../models/AuditLog.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { ApiError } from "../../middleware/error.js";
import { authenticate } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permission.js";
import { recordAudit } from "../common/audit.js";

const router = Router();
router.use(authenticate);

router.get(
  "/modules",
  requirePermission("system_settings", "view"),
  asyncHandler(async (_req, res) => {
    const menus = await SidebarMenu.find().sort({ order: 1 }).lean();
    res.json({ items: menus });
  }),
);

const toggleSchema = z.object({ enabled: z.boolean() });

router.patch(
  "/modules/:shortCode",
  requirePermission("system_settings", "edit"),
  asyncHandler(async (req, res) => {
    const parsed = toggleSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("enabled boolean required");
    const menu = await SidebarMenu.findOneAndUpdate(
      { shortCode: req.params.shortCode },
      { enabled: parsed.data.enabled },
      { new: true },
    );
    if (!menu) throw ApiError.notFound();
    await recordAudit({ userId: req.auth!.id, userName: req.auth!.name, action: "toggle-module", resource: menu.shortCode, meta: { enabled: menu.enabled } });
    res.json(menu);
  }),
);

router.get(
  "/menus",
  requirePermission("system_settings", "view"),
  asyncHandler(async (_req, res) => {
    const [menus, submenus] = await Promise.all([
      SidebarMenu.find().sort({ order: 1 }).lean(),
      SidebarSubMenu.find().sort({ order: 1 }).lean(),
    ]);
    res.json({
      menus: menus.map((m) => ({
        ...m,
        submenus: submenus.filter((s) => s.moduleShortCode === m.shortCode),
      })),
    });
  }),
);

router.patch(
  "/submenus/:shortCode",
  requirePermission("system_settings", "edit"),
  asyncHandler(async (req, res) => {
    const parsed = toggleSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("enabled boolean required");
    const sub = await SidebarSubMenu.findOneAndUpdate({ shortCode: req.params.shortCode }, { enabled: parsed.data.enabled }, { new: true });
    if (!sub) throw ApiError.notFound();
    res.json(sub);
  }),
);

router.get(
  "/permission-groups",
  requirePermission("system_settings", "view"),
  asyncHandler(async (_req, res) => {
    res.json({ items: await PermissionGroup.find().sort({ shortCode: 1 }).lean() });
  }),
);

router.get(
  "/roles",
  requirePermission("system_settings", "view"),
  asyncHandler(async (_req, res) => {
    res.json({ items: await Role.find().sort({ name: 1 }).lean() });
  }),
);

const roleUpdateSchema = z.object({
  description: z.string().optional(),
  groups: z.array(z.object({ shortCode: z.string(), actions: z.array(z.string()) })).optional(),
  studentPanel: z.array(z.string()).optional(),
});

router.patch(
  "/roles/:id",
  requirePermission("system_settings", "edit"),
  asyncHandler(async (req, res) => {
    const parsed = roleUpdateSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid role payload");
    const role = await Role.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
    if (!role) throw ApiError.notFound();
    await recordAudit({ userId: req.auth!.id, userName: req.auth!.name, action: "update-role", resource: role.name });
    res.json(role);
  }),
);

router.get(
  "/users",
  requirePermission("system_settings", "view"),
  asyncHandler(async (_req, res) => {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json({ items: users.map(({ passwordHash: _ph, ...rest }) => rest) });
  }),
);

const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().min(3),
  password: z.string().min(6),
  role: z.string().min(1),
  type: z.enum(["staff", "student", "parent"]).default("staff"),
  phone: z.string().optional(),
});

router.post(
  "/users",
  requirePermission("system_settings", "create"),
  asyncHandler(async (req, res) => {
    const parsed = userCreateSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Invalid user payload", parsed.error.flatten());
    const exists = await User.findOne({ email: parsed.data.email.toLowerCase() });
    if (exists) throw ApiError.conflict("Email already in use");
    const user = await User.create({
      ...parsed.data,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.data.password),
    });
    await recordAudit({ userId: req.auth!.id, userName: req.auth!.name, action: "create-user", resource: "users", resourceId: String(user._id) });
    res.status(201).json({ id: String(user._id), name: user.name, email: user.email, role: user.role, type: user.type });
  }),
);

router.patch(
  "/users/:id",
  requirePermission("system_settings", "edit"),
  asyncHandler(async (req, res) => {
    const patch: Record<string, unknown> = {};
    for (const key of ["name", "role", "type", "phone", "isActive"] as const) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (req.body.password) patch.passwordHash = await hashPassword(String(req.body.password));
    const user = await User.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!user) throw ApiError.notFound();
    res.json(user);
  }),
);

router.get(
  "/audit",
  requirePermission("system_settings", "view"),
  asyncHandler(async (_req, res) => {
    const items = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ items });
  }),
);

export default router;
