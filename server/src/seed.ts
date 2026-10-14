import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { CORE_MODULES, ADDON_MODULES, STUDENT_PANEL_MODULE, type ModuleDef } from "./platform/catalog.js";
import { PERMISSION_GROUPS, DEFAULT_ROLES, STUDENT_PANEL_CODES } from "./platform/permissions.js";
import { PermissionGroup } from "./models/PermissionGroup.js";
import { SidebarMenu } from "./models/SidebarMenu.js";
import { SidebarSubMenu } from "./models/SidebarSubMenu.js";
import { Role } from "./models/Role.js";
import { User, hashPassword } from "./models/User.js";
import { EntityRecord } from "./models/EntityRecord.js";
import { Setting } from "./models/Setting.js";

const CLASSES = ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
const SECTIONS = ["A", "B", "C"];
const GENDERS = ["Male", "Female"];
const FIRST_NAMES = ["Aarav", "Diya", "Vihaan", "Ananya", "Arjun", "Ishita", "Kabir", "Meera", "Rohan", "Saanvi", "Karthik", "Priya", "Aditya", "Nila", "Hari", "Kavya", "Rahul", "Deepa", "Vikram", "Sneha", "Manoj", "Lakshmi", "Surya", "Anita"];
const LAST_NAMES = ["Kumar", "Raman", "Iyer", "Nair", "Pillai", "Menon", "Sharma", "Reddy", "Verma", "Gupta", "Das", "Bose"];
const STAFF_ROLES = ["Teacher", "Accountant", "Librarian", "Admin", "Support", "Driver"];
const DEPARTMENTS = ["Mathematics", "Science", "English", "Admin", "Library", "Transport"];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmt(d);
}

function monthAgo(n: number, day = 10) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  return fmt(d);
}

async function seedMenusAndPermissions() {
  console.log("[seed] permission groups & sidebar menus");

  const groups = [
    ...PERMISSION_GROUPS,
    { shortCode: "student_panel", label: "Student / Parent Panel", actions: ["view"] as const, isStudentPanel: true },
  ];
  for (const group of groups) {
    await PermissionGroup.updateOne(
      { shortCode: group.shortCode },
      { $set: { label: group.label, actions: [...group.actions], isStudentPanel: Boolean(group.isStudentPanel) } },
      { upsert: true },
    );
  }

  await SidebarMenu.deleteMany({});
  await SidebarSubMenu.deleteMany({});

  const all: ModuleDef[] = [...CORE_MODULES, ...ADDON_MODULES, STUDENT_PANEL_MODULE];
  let order = 0;
  for (const module of all) {
    order += 1;
    await SidebarMenu.create({
      shortCode: module.shortCode,
      label: module.label,
      icon: module.icon,
      order,
      isAddon: Boolean(module.isAddon),
      isStudentPanel: Boolean(module.isStudentPanel),
      enabled: true,
      permissionGroup: module.isStudentPanel ? "student_panel" : module.shortCode,
    });
    let subOrder = 0;
    for (const section of module.sections) {
      subOrder += 1;
      await SidebarSubMenu.create({
        shortCode: section.shortCode,
        label: section.label,
        moduleShortCode: module.shortCode,
        order: subOrder,
        permissionGroup: module.isStudentPanel ? "student_panel" : module.shortCode,
        enabled: true,
      });
    }
  }

  console.log(`[seed]   -> ${all.length} modules, ${all.reduce((n, m) => n + m.sections.length, 0)} topics`);

  for (const role of DEFAULT_ROLES) {
    const groupsArray = Object.entries(role.groups).map(([shortCode, actions]) => ({ shortCode, actions }));
    await Role.updateOne(
      { name: role.name },
      { $set: { description: role.description, isAdmin: Boolean(role.isAdmin), isSystem: true, groups: groupsArray, studentPanel: role.studentPanel ?? [] } },
      { upsert: true },
    );
  }
  console.log(`[seed]   -> ${DEFAULT_ROLES.length} roles`);

  await Setting.updateOne(
    { key: "school" },
    { $set: { value: { name: "SVConnect Public School", session: "2025-2026", address: "12 Knowledge Park, Chennai", phone: "+91 90000 00000", email: "office@svconnect.test", currency: "INR", symbol: "\u20b9" } } },
    { upsert: true },
  );
}

async function seedUsers() {
  console.log("[seed] users");
  const adminPassword = await hashPassword(env.seedAdminPassword);
  const teacherPassword = await hashPassword("Teacher@123");
  const studentPassword = await hashPassword("Student@123");

  await User.updateOne(
    { email: env.seedAdminEmail.toLowerCase() },
    { $set: { name: "System Administrator", passwordHash: adminPassword, role: "Administrator", type: "staff", isActive: true } },
    { upsert: true },
  );
  const demoUsers = [
    { name: "Ravi Teacher", email: "teacher@svconnect.test", role: "Teacher", type: "staff", phone: "+91 90000 10001" },
    { name: "Priya Accountant", email: "accountant@svconnect.test", role: "Accountant", type: "staff", phone: "+91 90000 10002" },
    { name: "Latha Librarian", email: "librarian@svconnect.test", role: "Librarian", type: "staff", phone: "+91 90000 10003" },
  ];
  for (const u of demoUsers) {
    await User.updateOne(
      { email: u.email },
      { $set: { ...u, passwordHash: teacherPassword, isActive: true } },
      { upsert: true },
    );
  }
  await User.updateOne(
    { email: "student@svconnect.test" },
    { $set: { name: "Aarav Kumar", role: "Student", type: "student", passwordHash: studentPassword, isActive: true, phone: "+91 90000 20001" } },
    { upsert: true },
  );
  console.log(`[seed]   -> ${demoUsers.length + 2} users (admin / ${env.seedAdminEmail})`);
}

async function add(module: string, submenu: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const docs = rows.map((data) => ({ module, submenu, data }));
  const size = 1000;
  for (let i = 0; i < docs.length; i += size) {
    await EntityRecord.insertMany(docs.slice(i, i + size));
  }
}

async function seedSampleData() {
  console.log("[seed] sample data");
  await EntityRecord.deleteMany({});

  const STD_CLASSES = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
  const STD_SECTIONS = ["A", "B", "C"];
  const HOUSES = ["Red", "Blue", "Green", "Yellow"];
  const PER_SECTION = 100;
  const students: Record<string, unknown>[] = [];
  let adm = 1;
  STD_CLASSES.forEach((cls, ci) => {
    STD_SECTIONS.forEach((section) => {
      for (let s = 0; s < PER_SECTION; s += 1) {
        const i = students.length;
        students.push({
          admission_no: `ADM2025${String(adm).padStart(4, "0")}`,
          first_name: pick(FIRST_NAMES, i),
          last_name: pick(LAST_NAMES, i + 3),
          gender: pick(GENDERS, i),
          dob: `20${12 + (ci % 6)}-0${(i % 9) + 1}-${String((i % 27) + 1).padStart(2, "0")}`,
          class: cls,
          section,
          house: HOUSES[Math.floor((s / PER_SECTION) * HOUSES.length)],
          guardian_name: `${pick(FIRST_NAMES, i + 5)} ${pick(LAST_NAMES, i)}`,
          mobile: `+91 98${String(100000 + i * 137).slice(0, 8)}`,
          email: `student${adm}@svconnect.test`,
          address: `${i + 1}, School Street, Chennai`,
          status: "Active",
        });
        adm += 1;
      }
    });
  });
  await add("student_information", "student_details", students);

  await add(
    "student_information",
    "student_house",
    HOUSES.map((name) => ({ house_name: name, description: `${name} house` })),
  );

  await add(
    "student_information",
    "student_categories",
    ["General", "OBC", "SC", "ST", "EWS", "Minority"].map((category) => ({
      category,
      description: `${category} category`,
    })),
  );

  await add(
    "student_information",
    "disable_reason",
    ["Transfer", "Dropout", "Long Absence", "Fee Default", "Other"].map((reason) => ({
      reason,
      description: `Disabled due to ${reason}`,
    })),
  );

  const SUBJECTS = ["Tamil", "English", "Mathematics", "Science", "Social Science", "Computer Science"];
  const SUBJECT_TEACHERS: Record<string, string> = {
    Tamil: "Kavya Raman",
    English: "Deepa Nair",
    Mathematics: "Karthik Iyer",
    Science: "Priya Menon",
    "Social Science": "Hari Sharma",
    "Computer Science": "Surya Reddy",
  };
  const CLASS_TEACHERS = ["Anita Kumar", "Manoj Verma", "Lakshmi Das", "Vikram Bose", "Meera Pillai", "Rohan Gupta"];
  const PERIODS: [string, string][] = [
    ["09:00", "09:45"],
    ["09:45", "10:30"],
    ["10:45", "11:30"],
    ["11:30", "12:15"],
    ["13:15", "14:00"],
  ];
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const subjects = STD_CLASSES.flatMap((cls, ci) =>
    SUBJECTS.map((name, si) => ({
      class: cls,
      subject_name: name,
      subject_code: `${name.slice(0, 3).toUpperCase()}${ci + 1}`,
      subject_type: si < 3 ? "Theory" : "Practical",
      teacher: SUBJECT_TEACHERS[name],
    })),
  );
  await add("academics", "subjects", subjects);

  const timetable: Record<string, unknown>[] = [];
  STD_CLASSES.forEach((cls, ci) => {
    STD_SECTIONS.forEach((section, secIdx) => {
      DAYS.forEach((day, di) => {
        PERIODS.forEach(([start, end], pi) => {
          const subject = SUBJECTS[(ci + di + pi + secIdx) % SUBJECTS.length];
          timetable.push({
            class: cls,
            section,
            day,
            subject,
            teacher: SUBJECT_TEACHERS[subject],
            start_time: start,
            end_time: end,
            room: `${cls.replace("Class ", "")}${section}-${pi + 1}`,
          });
        });
      });
    });
  });
  await add("academics", "class_timetable", timetable);

  await add(
    "academics",
    "teachers_timetable",
    timetable.map((t) => ({
      teacher: t.teacher,
      class: t.class,
      section: t.section,
      day: t.day,
      start_time: t.start_time,
      end_time: t.end_time,
    })),
  );

  const classTeachers: Record<string, unknown>[] = [];
  STD_CLASSES.forEach((cls, ci) => {
    STD_SECTIONS.forEach((section, si) => {
      classTeachers.push({
        class: cls,
        section,
        teacher: CLASS_TEACHERS[(ci + si) % CLASS_TEACHERS.length],
      });
    });
  });
  await add("academics", "assign_class_teacher", classTeachers);

  await add(
    "academics",
    "class",
    STD_CLASSES.map((cls) => ({
      class_name: cls,
      sections: STD_SECTIONS.join(", "),
      note: `${cls} with sections ${STD_SECTIONS.join(", ")}`,
    })),
  );

  const sectionRows: Record<string, unknown>[] = [];
  STD_CLASSES.forEach((cls) => {
    STD_SECTIONS.forEach((section) => {
      sectionRows.push({
        section_name: section,
        class: cls,
        note: `${cls} - Section ${section}`,
      });
    });
  });
  await add("academics", "sections", sectionRows);

  const EXAM_GROUPS = [
    { name: "Term 1", type: "Term", offset: 0 },
    { name: "Half Yearly", type: "Half Yearly", offset: 3 },
    { name: "Annual", type: "Annual", offset: 6 },
  ];
  await add(
    "examination",
    "exam_group",
    EXAM_GROUPS.map((e) => ({
      name: e.name,
      exam_type: e.type,
      description: `${e.name} examination for all classes`,
    })),
  );

  const schedules: Record<string, unknown>[] = [];
  STD_CLASSES.forEach((cls) => {
    STD_SECTIONS.forEach((section) => {
      SUBJECTS.forEach((subject, si) => {
        EXAM_GROUPS.forEach((eg) => {
          schedules.push({
            exam_group: eg.name,
            name: `${cls} ${subject} ${eg.name}`,
            class: cls,
            section,
            subject,
            date: monthAgo(eg.offset, 6 + si),
            start_time: "09:30",
            end_time: "12:00",
            max_marks: 100,
          });
        });
      });
    });
  });
  await add("examination", "exam_schedule", schedules);

  const results: Record<string, unknown>[] = [];
  students.forEach((student, i) => {
    SUBJECTS.forEach((subject, si) => {
      EXAM_GROUPS.forEach((eg, ei) => {
        const obtained = 42 + ((i * 7 + si * 13 + ei * 11) % 59);
        results.push({
          exam_group: eg.name,
          student: `${student.first_name} ${student.last_name}`,
          class: student.class,
          subject,
          marks_obtained: obtained,
          max_marks: 100,
          percentage: obtained,
        });
      });
    });
  });
  await add("examination", "exam_result", results);

  const staff = Array.from({ length: 12 }).map((_, i) => ({
    employee_id: `EMP${String(i + 1).padStart(3, "0")}`,
    name: `${pick(FIRST_NAMES, i + 2)} ${pick(LAST_NAMES, i + 1)}`,
    role: pick(STAFF_ROLES, i),
    department: pick(DEPARTMENTS, i),
    designation: pick(STAFF_ROLES, i),
    mobile: `+91 90${String(200000 + i * 251).slice(0, 8)}`,
    email: `staff${i + 1}@svconnect.test`,
    joining_date: daysAgo(300 + i * 30),
    basic_salary: 25000 + i * 1500,
  }));
  await add("human_resource", "staff_directory", staff);

  const staffAttendance: Record<string, unknown>[] = [];
  for (let d = 0; d < 7; d += 1) {
    const date = daysAgo(d);
    staff.forEach((st, i) => {
      staffAttendance.push({
        staff: st.name,
        date,
        status: (i + d) % 11 === 0 ? "Absent" : (i + d) % 6 === 0 ? "Late" : d === 2 && i === 3 ? "Leave" : "Present",
        note: d === 0 ? "Marked by admin" : "",
      });
    });
  }
  await add("human_resource", "staff_attendance", staffAttendance);

  const fees = Array.from({ length: 36 }).map((_, i) => {
    const student = students[i % students.length];
    const monthOffset = i % 6;
    return {
      student: `${student.first_name} ${student.last_name}`,
      fees_group: "Tuition Fees",
      fees_type: pick(["Monthly Fee", "Exam Fee", "Transport Fee", "Library Fee"], i),
      amount: 3000 + (i % 5) * 500,
      discount: i % 4 === 0 ? 200 : 0,
      fine: i % 7 === 0 ? 100 : 0,
      date: monthAgo(monthOffset, 5 + (i % 20)),
      mode: pick(["Cash", "Online", "UPI", "Cheque"], i),
      note: "Fee payment received",
    };
  });
  await add("fees_collection", "collect_fees", fees);

  const dues = Array.from({ length: 14 }).map((_, i) => {
    const student = students[i % students.length];
    return {
      student: `${student.first_name} ${student.last_name}`,
      class: student.class,
      due_amount: 5000 + i * 250,
      balance: 2500 + i * 150,
    };
  });
  await add("fees_collection", "search_due_fees", dues);

  await add(
    "front_office",
    "admission_enquiry",
    Array.from({ length: 16 }).map((_, i) => ({
      name: `${pick(FIRST_NAMES, i + 4)} ${pick(LAST_NAMES, i + 2)}`,
      phone: `+91 97${String(300000 + i * 211).slice(0, 8)}`,
      email: `enquiry${i + 1}@example.com`,
      class: pick(CLASSES, i),
      source: pick(["Walk-in", "Phone", "Website", "Referral", "Advertisement"], i),
      date: daysAgo(i * 2),
      status: pick(["New", "Follow Up", "Converted", "Closed"], i),
      description: "Interested in admission",
    })),
  );

  await add(
    "front_office",
    "visitor_book",
    Array.from({ length: 20 }).map((_, i) => {
      const inHour = 8 + (i % 9);
      return {
        name: `${pick(FIRST_NAMES, i + 1)} ${pick(LAST_NAMES, i + 4)}`,
        phone: `+91 95${String(500000 + i * 197).slice(0, 8)}`,
        purpose: pick(["Parent Meeting", "Fee Payment", "Enquiry", "Document Submission", "Interview", "Delivery"], i),
        visiting_person: pick(["Principal", "Class Teacher", "Accountant", "Vice Principal", "Librarian"], i),
        date: daysAgo(i % 10),
        in_time: `${String(inHour).padStart(2, "0")}:${pick(["00", "15", "30", "45"], i)}`,
        out_time: `${String(inHour + 1).padStart(2, "0")}:${pick(["00", "15", "30", "45"], i)}`,
        guests: 1 + (i % 4),
      };
    }),
  );

  await add(
    "front_office",
    "phone_call_log",
    Array.from({ length: 20 }).map((_, i) => ({
      name: `${pick(FIRST_NAMES, i + 6)} ${pick(LAST_NAMES, i + 2)}`,
      phone: `+91 94${String(600000 + i * 223).slice(0, 8)}`,
      call_type: pick(["Incoming", "Outgoing"], i),
      purpose: pick(["Admission Enquiry", "Fee Reminder", "Absent Info", "Transport Query", "Exam Schedule", "Leave Request"], i),
      date: daysAgo(i % 12),
      duration: `${1 + (i % 12)}:${pick(["05", "10", "20", "30", "45"], i)}`,
      note: "Call logged by front office",
    })),
  );

  await add(
    "front_office",
    "postal_dispatch",
    Array.from({ length: 12 }).map((_, i) => ({
      to_title: `${pick(["Department of Education", "District Office", "Parent of", "Alumni", "Bank Manager", "Vendor"], i)} ${pick(LAST_NAMES, i)}`,
      reference_no: `DISP${String(1001 + i)}`,
      address: `${i + 5}, ${pick(["Anna Salai", "MG Road", "Gandhi Street", "Nehru Nagar", "Bazaar Road"], i)}, Chennai`,
      date: daysAgo(i * 3),
      note: pick(["Fee receipt", "Transfer certificate", "Bonafide letter", "Circular", "Invoice"], i),
    })),
  );

  await add(
    "front_office",
    "postal_receive",
    Array.from({ length: 12 }).map((_, i) => ({
      from_title: `${pick(["Board of Studies", "Post Office", "Parent of", "University", "Government Office"], i)} ${pick(LAST_NAMES, i + 3)}`,
      reference_no: `RECV${String(2001 + i)}`,
      address: `${i + 12}, ${pick(["Mount Road", "Poonamallee High Road", "Beach Road", "Kamraj Salai", "TTK Road"], i)}, Chennai`,
      date: daysAgo(i * 2 + 1),
      note: pick(["Exam question paper", "Bank statement", "Government circular", "Parcel", "Certificate"], i),
    })),
  );

  await add(
    "front_office",
    "complain",
    Array.from({ length: 15 }).map((_, i) => {
      const status = pick(["Open", "In Progress", "Resolved"], i);
      return {
        title: pick(["Water leakage in classroom", "Broken bench", "Bus delay", "Library book missing", "Fee receipt not issued", "Fan not working", "Dirty washroom", "Canteen food quality", "Late homework", "Transport route change"], i),
        complain_by: `${pick(["Parent", "Student", "Teacher", "Staff"], i)} - ${pick(FIRST_NAMES, i + 3)} ${pick(LAST_NAMES, i)}`,
        date: daysAgo(i * 2),
        complain_type: pick(["Academic", "Transport", "Hostel", "Library", "Fees", "Other"], i),
        description: "Reported to the front office and forwarded to the concerned department.",
        action_taken: status === "Resolved" ? "Issue fixed and verified by the department head." : status === "In Progress" ? "Assigned to maintenance team." : "",
        status,
      };
    }),
  );

  await add(
    "front_office",
    "setup_front_office",
    ["Parent Meeting", "Fee Payment", "Enquiry", "Document Submission", "Interview", "Delivery", "Other"].map((purpose, i) => ({
      purpose,
      description: `Visitor / call purpose category: ${purpose}`,
      order: String(i + 1),
    })),
  );

  await add(
    "student_information",
    "online_admission",
    Array.from({ length: 8 }).map((_, i) => ({
      first_name: pick(FIRST_NAMES, i + 7),
      last_name: pick(LAST_NAMES, i),
      email: `online${i + 1}@example.com`,
      mobile: `+91 96${String(400000 + i * 173).slice(0, 8)}`,
      class: pick(CLASSES, i + 1),
      status: pick(["Pending", "Approved", "Rejected"], i),
      note: "Applied through website",
    })),
  );

  const attendance: Record<string, unknown>[] = [];
  for (let d = 0; d < 7; d += 1) {
    const date = daysAgo(d);
    for (let i = 0; i < 20; i += 1) {
      const student = students[i % students.length];
      attendance.push({
        student: `${student.first_name} ${student.last_name}`,
        class: student.class,
        section: student.section,
        date,
        status: (i + d) % 9 === 0 ? "Absent" : (i + d) % 7 === 0 ? "Late" : "Present",
      });
    }
  }
  await add("student_attendance", "student_attendance", attendance);

  await add(
    "communicate",
    "notice_board",
    Array.from({ length: 6 }).map((_, i) => ({
      title: `Notice ${i + 1}: ${pick(["PTM", "Holiday", "Exam", "Sports Day", "Fee Reminder", "Cultural Fest"], i)}`,
      date: daysAgo(i * 3),
      audience: pick(["All", "Students", "Parents", "Staff"], i),
      message: "Please check the school portal for more details.",
    })),
  );

  await add(
    "homework",
    "add_homework",
    Array.from({ length: 10 }).map((_, i) => ({
      class: pick(CLASSES, i),
      section: pick(SECTIONS, i),
      subject: pick(["Mathematics", "Science", "English", "Tamil", "Social Science"], i),
      homework_date: daysAgo(i),
      submission_date: daysAgo(i - 4),
      description: "Complete exercises and submit in the next class.",
    })),
  );

  const BOOK_TITLES = ["Algebra", "Physics", "Grammar", "History", "Chemistry", "Geography", "Biology", "Tamil Literature", "English Reader", "Moral Science", "Computer Basics", "General Knowledge", "Drawing", "Environmental Studies", "Mathematics Part 1", "Mathematics Part 2", "Social Studies", "Handwriting", "Story Collection", "Atlas"];
  const books = BOOK_TITLES.map((t, i) => ({
    title: t,
    author: `${pick(FIRST_NAMES, i)} ${pick(LAST_NAMES, i)}`,
    isbn: `978-0-00-${String(10000 + i)}`,
    category: pick(["Academic", "Fiction", "Reference", "Science"], i),
    publisher: pick(["Oxford", "Cambridge", "Pearson", "NCERT", "S.Chand"], i),
    quantity: 5 + (i % 10),
    available: 3 + (i % 5),
  }));
  await add("library", "book_list", books);

  const issues = Array.from({ length: 60 }).map((_, i) => {
    const student = students[(i * 37) % students.length];
    const status = pick(["Issued", "Returned", "Overdue"], i);
    const offset = (i % 20) + 1;
    return {
      book: books[i % books.length].title,
      student: `${student.first_name} ${student.last_name} (${student.class}-${student.section})`,
      issue_date: daysAgo(offset + 14),
      due_date: daysAgo(offset + 7),
      return_date: status === "Returned" ? daysAgo(offset) : "",
      status,
    };
  });
  await add("library", "issue_return", issues);

  const libraryStudents = Array.from({ length: 40 }).map((_, i) => {
    const student = students[(i * 29) % students.length];
    return {
      student: `${student.first_name} ${student.last_name} (${student.class}-${student.section})`,
      library_card_no: `LIB-S${String(1001 + i)}`,
      date: daysAgo(60 - i),
    };
  });
  await add("library", "add_student", libraryStudents);

  await add(
    "library",
    "add_staff_member",
    staff.map((st, i) => ({
      staff: st.name,
      library_card_no: `LIB-T${String(201 + i)}`,
      date: daysAgo(90 - i * 2),
    })),
  );

  await add(
    "income",
    "add_income",
    Array.from({ length: 10 }).map((_, i) => ({
      income_head: pick(["Fees", "Donation", "Grant", "Rent"], i),
      name: `Income entry ${i + 1}`,
      invoice_no: `INC${1000 + i}`,
      date: monthAgo(i % 5, 8),
      amount: 10000 + i * 2500,
      note: "Received",
    })),
  );

  await add(
    "expense",
    "add_expense",
    Array.from({ length: 10 }).map((_, i) => ({
      expense_head: pick(["Salary", "Maintenance", "Utilities", "Supplies"], i),
      name: `Expense entry ${i + 1}`,
      invoice_no: `EXP${2000 + i}`,
      date: monthAgo(i % 5, 12),
      amount: 5000 + i * 1800,
      note: "Paid",
    })),
  );

  const total = await EntityRecord.countDocuments();
  console.log(`[seed]   -> ${total} sample records`);
}

async function main() {
  await connectDatabase();
  await seedMenusAndPermissions();
  await seedUsers();
  await seedSampleData();
  console.log("\n[seed] done.");
  console.log(`[seed] login: ${env.seedAdminEmail} / ${env.seedAdminPassword}`);
  console.log("[seed] teacher: teacher@svconnect.test / Teacher@123");
  console.log("[seed] student: student@svconnect.test / Student@123");
  console.log(`[seed] student panel codes: ${STUDENT_PANEL_CODES.length}`);
  await disconnectDatabase();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDatabase();
  process.exit(1);
});
