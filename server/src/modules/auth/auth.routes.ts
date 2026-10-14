import { Router } from "express";
import { z } from "zod";
import { User } from "../../models/User.js";
import { Role } from "../../models/Role.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { ApiError } from "../../middleware/error.js";
import { authenticate, buildAuthContext, signToken } from "../../middleware/auth.js";
import { recordAudit } from "../common/audit.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().min(3),
  password: z.string().min(1),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest("Email and password are required");
    const { email, password } = parsed.data;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.comparePassword(password))) {
      throw ApiError.unauthorized("Invalid email or password");
    }
    if (!user.isActive) throw ApiError.forbidden("Account is disabled");

    user.lastLoginAt = new Date();
    await user.save();

    const role = await Role.findOne({ name: user.role });
    const auth = buildAuthContext(user, role);
    const token = signToken(String(user._id));
    await recordAudit({ userId: auth.id, userName: auth.name, action: "login", resource: "auth", ip: req.ip });

    res.json({
      token,
      user: { id: auth.id, name: auth.name, email: auth.email, role: auth.role, type: auth.type, isAdmin: auth.isAdmin },
    });
  }),
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const role = await Role.findOne({ name: auth.role });
    res.json({
      user: { id: auth.id, name: auth.name, email: auth.email, role: auth.role, type: auth.type, isAdmin: auth.isAdmin },
      permissions: Object.fromEntries([...auth.groups.entries()].map(([k, v]) => [k, [...v]])),
      studentPanel: [...auth.studentPanel],
      roleDescription: role?.description ?? "",
    });
  }),
);

export default router;
