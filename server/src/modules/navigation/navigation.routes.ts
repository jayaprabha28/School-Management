import { Router } from "express";
import { SidebarMenu } from "../../models/SidebarMenu.js";
import { SidebarSubMenu } from "../../models/SidebarSubMenu.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authenticate } from "../../middleware/auth.js";
import { findSubmenu } from "../../platform/catalog.js";
import { hasPermission } from "../../middleware/permission.js";

const router = Router();

/**
 * GET /api/navigation
 * Database-driven sidebar, filtered by role permissions and enabled modules.
 * Hidden items are a UI convenience only - every API re-checks access.
 */
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const [menus, submenus] = await Promise.all([
      SidebarMenu.find().sort({ order: 1 }).lean(),
      SidebarSubMenu.find({ enabled: true }).sort({ order: 1 }).lean(),
    ]);

    const subsByModule = new Map<string, typeof submenus>();
    for (const sub of submenus) {
      const list = subsByModule.get(sub.moduleShortCode) || [];
      list.push(sub);
      subsByModule.set(sub.moduleShortCode, list);
    }

    const isStudentUser = auth.type === "student" || auth.type === "parent";

    const modules = menus
      .filter((menu) => {
        if (!menu.enabled && !auth.isAdmin) return false;
        if (menu.isStudentPanel) return isStudentUser || auth.isAdmin;
        if (menu.isAddon) return menu.enabled && hasPermission(auth, menu.shortCode, "view");
        return hasPermission(auth, menu.shortCode, "view");
      })
      .map((menu) => {
        const subs = subsByModule.get(menu.shortCode) || [];
        const sections = subs
          .filter((sub) => {
            if (menu.isStudentPanel) return auth.isAdmin || auth.studentPanel.has(sub.shortCode);
            return true;
          })
          .map((sub) => {
            const catalogSub = findSubmenu(sub.shortCode);
            return {
              shortCode: sub.shortCode,
              label: sub.label,
              fields: catalogSub?.submenu.fields ?? [],
            };
          });

        return {
          shortCode: menu.shortCode,
          label: menu.label,
          icon: menu.icon,
          isAddon: menu.isAddon,
          isStudentPanel: menu.isStudentPanel,
          enabled: menu.enabled,
          sections,
        };
      })
      .filter((menu) => menu.sections.length > 0 || menu.shortCode === "system_settings");

    res.json({
      modules,
      permissions: Object.fromEntries([...auth.groups.entries()].map(([k, v]) => [k, [...v]])),
      studentPanel: [...auth.studentPanel],
      isAdmin: auth.isAdmin,
    });
  }),
);

export default router;
