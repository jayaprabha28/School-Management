import { Router } from "express";
import { EntityRecord } from "../../models/EntityRecord.js";
import { asyncHandler } from "../../middleware/asyncHandler.js";
import { authenticate } from "../../middleware/auth.js";
import { findSubmenu } from "../../platform/catalog.js";

const router = Router();

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function countRecords(module: string, submenu: string) {
  return EntityRecord.countDocuments({ module, submenu, isDeleted: false });
}

async function sumField(module: string, submenu: string, field: string) {
  const rows = await EntityRecord.aggregate([
    { $match: { module, submenu, isDeleted: false } },
    {
      $group: {
        _id: null,
        total: { $sum: { $convert: { input: `$data.${field}`, to: "double", onError: 0, onNull: 0 } } },
      },
    },
  ]);
  return rows[0]?.total ?? 0;
}

router.get(
  "/",
  authenticate,
  asyncHandler(async (_req, res) => {
    const [
      studentCount,
      staffCount,
      enquiryCount,
      onlineAdmissions,
      feesCollected,
      pendingDues,
      expenses,
      income,
    ] = await Promise.all([
      countRecords("student_information", "student_details"),
      countRecords("human_resource", "staff_directory"),
      countRecords("front_office", "admission_enquiry"),
      countRecords("student_information", "online_admission"),
      sumField("fees_collection", "collect_fees", "amount"),
      sumField("fees_collection", "search_due_fees", "balance"),
      sumField("expense", "add_expense", "amount"),
      sumField("income", "add_income", "amount"),
    ]);

    const attendanceRows = await EntityRecord.aggregate([
      { $match: { module: "student_attendance", submenu: "student_attendance", isDeleted: false, "data.date": todayISO() } },
      { $group: { _id: "$data.status", count: { $sum: 1 } } },
    ]);
    const attendanceToday: Record<string, number> = {};
    for (const row of attendanceRows) attendanceToday[row._id || "Unknown"] = row.count;

    const monthlyFees = await EntityRecord.aggregate([
      { $match: { module: "fees_collection", submenu: "collect_fees", isDeleted: false } },
      {
        $group: {
          _id: { $substrCP: [{ $ifNull: ["$data.date", ""] }, 0, 7] },
          total: { $sum: { $convert: { input: "$data.amount", to: "double", onError: 0, onNull: 0 } } },
        },
      },
      { $match: { _id: { $ne: "" } } },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]);

    const attendanceTrend = await EntityRecord.aggregate([
      { $match: { module: "student_attendance", submenu: "student_attendance", isDeleted: false } },
      { $group: { _id: { date: "$data.date", status: "$data.status" }, count: { $sum: 1 } } },
      { $sort: { "_id.date": 1 } },
      { $limit: 120 },
    ]);

    const recent = await EntityRecord.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(8).lean();
    const recentActivity = recent.map((r) => {
      const found = findSubmenu(r.submenu);
      const data = (r.data || {}) as Record<string, unknown>;
      const label =
        (data.name as string) ||
        (data.title as string) ||
        (data.student as string) ||
        (data.item_name as string) ||
        "Record";
      return {
        id: String(r._id),
        module: r.module,
        submenu: r.submenu,
        section: found?.submenu.label ?? r.submenu,
        label,
        at: r.createdAt,
      };
    });

    res.json({
      cards: {
        students: studentCount,
        staff: staffCount,
        enquiries: enquiryCount,
        onlineAdmissions,
        feesCollected,
        pendingDues,
        expenses,
        income,
        attendanceToday,
      },
      monthlyFees: monthlyFees.map((m) => ({ month: m._id, total: m.total })),
      attendanceTrend: attendanceTrend.map((a) => ({ date: a._id.date, status: a._id.status, count: a.count })),
      recentActivity,
    });
  }),
);

export default router;
