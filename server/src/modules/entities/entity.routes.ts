import { Router } from "express";
import { Types } from "mongoose";
import { EntityRecord } from "../../models/EntityRecord.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { ApiError } from "../../middleware/error.js";
import { authenticate, type AuthContext } from "../../middleware/auth.js";
import { canAccessSubmenu } from "../../middleware/permission.js";
import { findSubmenu, type FieldDef } from "../../platform/catalog.js";
import { recordAudit } from "../common/audit.js";

const router = Router();

function resolveSubmenu(shortCode: string) {
  const found = findSubmenu(shortCode);
  if (!found) throw ApiError.notFound(`Unknown module topic: ${shortCode}`);
  return found;
}

function coerceValue(field: FieldDef, raw: unknown): unknown {
  if (raw === undefined || raw === null || raw === "") {
    return field.type === "checkbox" ? false : null;
  }
  switch (field.type) {
    case "number":
    case "currency": {
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    }
    case "checkbox":
      return raw === true || raw === "true" || raw === "on" || raw === 1 || raw === "1";
    default:
      return typeof raw === "string" ? raw.trim() : String(raw);
  }
}

function buildData(fields: FieldDef[], body: Record<string, unknown>, partial: boolean) {
  const data: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const provided = Object.prototype.hasOwnProperty.call(body, field.name);
    if (!provided) {
      if (!partial && field.required && field.type !== "checkbox") {
        errors[field.name] = `${field.label} is required`;
      }
      continue;
    }
    const value = coerceValue(field, body[field.name]);
    if (field.required && field.type !== "checkbox" && (value === null || value === "")) {
      errors[field.name] = `${field.label} is required`;
    }
    data[field.name] = value;
  }
  if (Object.keys(errors).length) throw ApiError.badRequest("Validation failed", errors);
  return data;
}

function isScopedStudent(auth: AuthContext) {
  return auth.type === "student" || auth.type === "parent";
}

router.use(authenticate);

router.get(
  "/:submenu",
  asyncHandler(async (req, res) => {
    const { module, submenu } = resolveSubmenu(String(req.params.submenu));
    if (!canAccessSubmenu(req.auth, submenu.shortCode, "view")) throw ApiError.forbidden();

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const q = String(req.query.q || "").trim();

    const filter: Record<string, unknown> = {
      module: module.shortCode,
      submenu: submenu.shortCode,
      isDeleted: false,
    };
    if (module.isStudentPanel && isScopedStudent(req.auth!)) {
      filter.owner = new Types.ObjectId(req.auth!.id);
    }
    for (const field of submenu.fields) {
      const raw = req.query[field.name];
      if (typeof raw === "string" && raw.trim() !== "") {
        filter[`data.${field.name}`] = raw.trim();
      }
    }
    if (q) {
      const searchable = submenu.fields.filter((f) => ["text", "textarea", "email", "phone", "select", "number"].includes(f.type));
      const or = searchable.map((f) => ({ [`data.${f.name}`]: { $regex: q, $options: "i" } }));
      if (or.length) filter.$or = or;
    }

    const [items, total] = await Promise.all([
      EntityRecord.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      EntityRecord.countDocuments(filter),
    ]);

    res.json({
      items: items.map((i) => ({ id: String(i._id), data: i.data, createdAt: i.createdAt, updatedAt: i.updatedAt })),
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      fields: submenu.fields,
      label: submenu.label,
      module: module.shortCode,
    });
  }),
);

router.post(
  "/:submenu",
  asyncHandler(async (req, res) => {
    const { module, submenu } = resolveSubmenu(String(req.params.submenu));
    if (!canAccessSubmenu(req.auth, submenu.shortCode, "create")) throw ApiError.forbidden();
    const data = buildData(submenu.fields, req.body || {}, false);
    const doc = await EntityRecord.create({
      module: module.shortCode,
      submenu: submenu.shortCode,
      data,
      owner: module.isStudentPanel && isScopedStudent(req.auth!) ? new Types.ObjectId(req.auth!.id) : null,
      createdBy: new Types.ObjectId(req.auth!.id),
    });
    await recordAudit({ userId: req.auth!.id, userName: req.auth!.name, action: "create", resource: submenu.shortCode, resourceId: String(doc._id), ip: req.ip });
    res.status(201).json({ id: String(doc._id), data: doc.data });
  }),
);

router.get(
  "/:submenu/:id",
  asyncHandler(async (req, res) => {
    const { module, submenu } = resolveSubmenu(String(req.params.submenu));
    if (!canAccessSubmenu(req.auth, submenu.shortCode, "view")) throw ApiError.forbidden();
    const filter: Record<string, unknown> = { _id: String(req.params.id), module: module.shortCode, submenu: submenu.shortCode, isDeleted: false };
    if (module.isStudentPanel && isScopedStudent(req.auth!)) filter.owner = new Types.ObjectId(req.auth!.id);
    const doc = await EntityRecord.findOne(filter).lean();
    if (!doc) throw ApiError.notFound();
    res.json({ id: String(doc._id), data: doc.data });
  }),
);

router.patch(
  "/:submenu/:id",
  asyncHandler(async (req, res) => {
    const { module, submenu } = resolveSubmenu(String(req.params.submenu));
    if (!canAccessSubmenu(req.auth, submenu.shortCode, "edit")) throw ApiError.forbidden();
    const filter: Record<string, unknown> = { _id: String(req.params.id), module: module.shortCode, submenu: submenu.shortCode, isDeleted: false };
    if (module.isStudentPanel && isScopedStudent(req.auth!)) filter.owner = new Types.ObjectId(req.auth!.id);
    const doc = await EntityRecord.findOne(filter);
    if (!doc) throw ApiError.notFound();
    const patch = buildData(submenu.fields, req.body || {}, true);
    doc.data = { ...(doc.data as Record<string, unknown>), ...patch };
    doc.updatedBy = new Types.ObjectId(req.auth!.id);
    doc.markModified("data");
    await doc.save();
    await recordAudit({ userId: req.auth!.id, userName: req.auth!.name, action: "update", resource: submenu.shortCode, resourceId: String(doc._id), ip: req.ip });
    res.json({ id: String(doc._id), data: doc.data });
  }),
);

router.delete(
  "/:submenu/:id",
  asyncHandler(async (req, res) => {
    const { module, submenu } = resolveSubmenu(String(req.params.submenu));
    if (!canAccessSubmenu(req.auth, submenu.shortCode, "delete")) throw ApiError.forbidden();
    const filter: Record<string, unknown> = { _id: String(req.params.id), module: module.shortCode, submenu: submenu.shortCode, isDeleted: false };
    if (module.isStudentPanel && isScopedStudent(req.auth!)) filter.owner = new Types.ObjectId(req.auth!.id);
    const doc = await EntityRecord.findOneAndUpdate(filter, { isDeleted: true, updatedBy: new Types.ObjectId(req.auth!.id) });
    if (!doc) throw ApiError.notFound();
    await recordAudit({ userId: req.auth!.id, userName: req.auth!.name, action: "delete", resource: submenu.shortCode, resourceId: String(doc._id), ip: req.ip });
    res.json({ ok: true });
  }),
);

export default router;
