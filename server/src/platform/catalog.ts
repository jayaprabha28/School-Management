/**
 * SVConnect module catalog.
 *
 * This is the single source of truth for the sidebar (modules + subtopics),
 * their permissions and the field schema used to render generic CRUD pages.
 *
 * On seed, this catalog is written into MongoDB collections
 * `sidebar_menus` and `sidebar_sub_menus`, so the menu can be edited at
 * runtime (System Settings -> Sidebar Menu). The API then serves the
 * database-driven navigation back to the client.
 */

export const PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "export",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "time"
  | "select"
  | "email"
  | "phone"
  | "checkbox";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface SubmenuDef {
  shortCode: string;
  label: string;
  fields: FieldDef[];
}

export interface ModuleDef {
  shortCode: string;
  label: string;
  icon: string;
  /** Add-on modules are only visible when enabled in System Settings -> Modules. */
  isAddon?: boolean;
  /** Student / parent panel module. Governed by permission_student. */
  isStudentPanel?: boolean;
  sections: SubmenuDef[];
}

/* -------------------------------------------------------------------------- */
/* Field helpers                                                              */
/* -------------------------------------------------------------------------- */

const text = (name: string, label: string, required = false): FieldDef => ({ name, label, type: "text", required });
const area = (name: string, label: string): FieldDef => ({ name, label, type: "textarea" });
const num = (name: string, label: string): FieldDef => ({ name, label, type: "number" });
const money = (name: string, label: string): FieldDef => ({ name, label, type: "currency" });
const dateF = (name: string, label: string): FieldDef => ({ name, label, type: "date" });
const timeF = (name: string, label: string): FieldDef => ({ name, label, type: "time" });
const sel = (name: string, label: string, options: string[], required = false): FieldDef => ({
  name,
  label,
  type: "select",
  options,
  required,
});
const emailF = (name: string, label: string): FieldDef => ({ name, label, type: "email" });
const phoneF = (name: string, label: string): FieldDef => ({ name, label, type: "phone" });
const check = (name: string, label: string): FieldDef => ({ name, label, type: "checkbox" });

const status = (): FieldDef => sel("status", "Status", ["Active", "Inactive"]);
const note = () => area("note", "Note");
const description = () => area("description", "Description");

/* -------------------------------------------------------------------------- */
/* Shared option sets                                                         */
/* -------------------------------------------------------------------------- */

const CLASSES = ["Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const SECTIONS = ["A", "B", "C"];
const GENDERS = ["Male", "Female", "Other"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PAY_MODES = ["Cash", "Cheque", "Bank Transfer", "Online", "UPI", "Card"];

const classField = () => sel("class", "Class", CLASSES, true);
const sectionField = () => sel("section", "Section", SECTIONS);

/* -------------------------------------------------------------------------- */
/* 23 core modules                                                            */
/* -------------------------------------------------------------------------- */

export const CORE_MODULES: ModuleDef[] = [
  {
    shortCode: "front_office",
    label: "Front Office",
    icon: "Building2",
    sections: [
      { shortCode: "admission_enquiry", label: "Admission Enquiry", fields: [text("name", "Name", true), phoneF("phone", "Phone"), emailF("email", "Email"), classField(), sel("source", "Source", ["Walk-in", "Phone", "Website", "Referral", "Advertisement"]), dateF("date", "Enquiry Date"), sel("status", "Status", ["New", "Follow Up", "Converted", "Closed"]), description()] },
      { shortCode: "visitor_book", label: "Visitor Book", fields: [text("name", "Visitor Name", true), phoneF("phone", "Phone"), text("purpose", "Purpose"), text("visiting_person", "Visiting Person"), dateF("date", "Date"), timeF("in_time", "In Time"), timeF("out_time", "Out Time"), num("guests", "No. of Guests")] },
      { shortCode: "phone_call_log", label: "Phone Call Log", fields: [text("name", "Name", true), phoneF("phone", "Phone"), sel("call_type", "Call Type", ["Incoming", "Outgoing"]), text("purpose", "Purpose"), dateF("date", "Date"), text("duration", "Duration"), note()] },
      { shortCode: "postal_dispatch", label: "Postal Dispatch", fields: [text("to_title", "To Title", true), text("reference_no", "Reference No"), area("address", "Address"), dateF("date", "Date"), note()] },
      { shortCode: "postal_receive", label: "Postal Receive", fields: [text("from_title", "From Title", true), text("reference_no", "Reference No"), area("address", "Address"), dateF("date", "Date"), note()] },
      { shortCode: "complain", label: "Complain", fields: [text("title", "Complain Title", true), text("complain_by", "Complain By"), dateF("date", "Date"), sel("complain_type", "Complain Type", ["Academic", "Transport", "Hostel", "Library", "Fees", "Other"]), area("description", "Description"), area("action_taken", "Action Taken"), sel("status", "Status", ["Open", "In Progress", "Resolved"])] },
      { shortCode: "setup_front_office", label: "Setup Front Office", fields: [text("purpose", "Purpose", true), description(), text("order", "Order")] },
    ],
  },
  {
    shortCode: "student_information",
    label: "Student Information",
    icon: "GraduationCap",
    sections: [
      { shortCode: "student_details", label: "Student Details", fields: [text("admission_no", "Admission No", true), text("first_name", "First Name", true), text("last_name", "Last Name"), sel("gender", "Gender", GENDERS), dateF("dob", "Date of Birth"), classField(), sectionField(), sel("house", "House", ["Red", "Blue", "Green", "Yellow"]), text("guardian_name", "Guardian Name"), phoneF("mobile", "Mobile"), emailF("email", "Email"), area("address", "Address"), sel("status", "Status", ["Active", "Disabled", "Passed Out"])] },
      { shortCode: "student_admission", label: "Student Admission", fields: [text("first_name", "First Name", true), text("last_name", "Last Name"), sel("gender", "Gender", GENDERS), dateF("dob", "Date of Birth"), classField(), sectionField(), text("guardian_name", "Guardian Name"), phoneF("mobile", "Mobile"), emailF("email", "Email"), area("address", "Address")] },
      { shortCode: "online_admission", label: "Online Admission", fields: [text("first_name", "First Name", true), text("last_name", "Last Name"), emailF("email", "Email"), phoneF("mobile", "Mobile"), classField(), sel("status", "Status", ["Pending", "Approved", "Rejected"]), note()] },
      { shortCode: "disabled_students", label: "Disabled Students", fields: [text("student", "Student", true), sel("disable_reason", "Disable Reason", ["Transfer", "Dropout", "Long Absence", "Fee Default", "Other"]), dateF("date", "Date"), note()] },
      { shortCode: "multi_class_student", label: "Multi Class Student", fields: [text("student", "Student", true), classField(), sectionField(), note()] },
      { shortCode: "bulk_delete", label: "Bulk Delete", fields: [classField(), sectionField()] },
      { shortCode: "student_categories", label: "Student Categories", fields: [text("category", "Category", true), description()] },
      { shortCode: "student_house", label: "Student House", fields: [text("house_name", "House Name", true), description()] },
      { shortCode: "disable_reason", label: "Disable Reason", fields: [text("reason", "Reason", true), description()] },
    ],
  },
  {
    shortCode: "fees_collection",
    label: "Fees Collection",
    icon: "Wallet",
    sections: [
      { shortCode: "collect_fees", label: "Collect Fees", fields: [text("student", "Student", true), text("fees_group", "Fees Group"), text("fees_type", "Fees Type"), money("amount", "Amount"), money("discount", "Discount"), money("fine", "Fine"), dateF("date", "Payment Date"), sel("mode", "Payment Mode", PAY_MODES), note()] },
      { shortCode: "offline_bank_payments", label: "Offline Bank Payments", fields: [text("student", "Student", true), money("amount", "Amount"), text("bank", "Bank Name"), text("reference", "Reference No"), dateF("date", "Date"), note()] },
      { shortCode: "search_fees_payment", label: "Search Fees Payment", fields: [text("student", "Student"), dateF("date", "From Date"), money("amount", "Amount"), note()] },
      { shortCode: "search_due_fees", label: "Search Due Fees", fields: [text("student", "Student"), classField(), money("due_amount", "Due Amount"), money("balance", "Balance")] },
      { shortCode: "fees_master", label: "Fees Master", fields: [text("name", "Name", true), text("fees_group", "Fees Group"), text("fees_type", "Fees Type"), money("amount", "Amount"), dateF("due_date", "Due Date")] },
      { shortCode: "fees_group", label: "Fees Group", fields: [text("name", "Name", true), description()] },
      { shortCode: "fees_type", label: "Fees Type", fields: [text("name", "Name", true), text("fees_code", "Fees Code"), description()] },
      { shortCode: "fees_discount", label: "Fees Discount", fields: [text("name", "Name", true), text("discount_code", "Discount Code"), num("amount", "Amount"), description()] },
      { shortCode: "fees_carry_forward", label: "Fees Carry Forward", fields: [text("student", "Student", true), text("from_session", "From Session"), text("to_session", "To Session"), money("amount", "Amount"), note()] },
      { shortCode: "fees_reminder", label: "Fees Reminder", fields: [text("student", "Student", true), area("message", "Message"), dateF("date", "Date")] },
    ],
  },
  {
    shortCode: "income",
    label: "Income",
    icon: "TrendingUp",
    sections: [
      { shortCode: "add_income", label: "Add Income", fields: [text("income_head", "Income Head", true), text("name", "Name", true), text("invoice_no", "Invoice No"), dateF("date", "Date"), money("amount", "Amount"), note()] },
      { shortCode: "search_income", label: "Search Income", fields: [text("income_head", "Income Head"), dateF("date", "Date"), money("amount", "Amount"), note()] },
      { shortCode: "income_head", label: "Income Head", fields: [text("name", "Name", true), description()] },
    ],
  },
  {
    shortCode: "expense",
    label: "Expense",
    icon: "TrendingDown",
    sections: [
      { shortCode: "add_expense", label: "Add Expense", fields: [text("expense_head", "Expense Head", true), text("name", "Name", true), text("invoice_no", "Invoice No"), dateF("date", "Date"), money("amount", "Amount"), note()] },
      { shortCode: "search_expense", label: "Search Expense", fields: [text("expense_head", "Expense Head"), dateF("date", "Date"), money("amount", "Amount"), note()] },
      { shortCode: "expense_head", label: "Expense Head", fields: [text("name", "Name", true), description()] },
    ],
  },
  {
    shortCode: "student_attendance",
    label: "Attendance",
    icon: "CalendarCheck",
    sections: [
      { shortCode: "student_attendance", label: "Student Attendance", fields: [text("student", "Student", true), classField(), sectionField(), dateF("date", "Date"), sel("status", "Status", ["Present", "Absent", "Late", "Half Day"])] },
      { shortCode: "approve_leave", label: "Approve Leave", fields: [text("student", "Student", true), dateF("from_date", "From Date"), dateF("to_date", "To Date"), area("reason", "Reason"), sel("status", "Status", ["Pending", "Approved", "Rejected"])] },
      { shortCode: "attendance_by_date", label: "Attendance By Date", fields: [classField(), sectionField(), dateF("date", "Date"), note()] },
      { shortCode: "period_attendance", label: "Period Attendance", fields: [text("student", "Student", true), classField(), sectionField(), text("subject", "Subject"), dateF("date", "Date"), sel("status", "Status", ["Present", "Absent", "Late"])] },
      { shortCode: "period_attendance_by_date", label: "Period Attendance By Date", fields: [classField(), sectionField(), text("subject", "Subject"), dateF("date", "Date"), note()] },
    ],
  },
  {
    shortCode: "examination",
    label: "Examinations",
    icon: "ClipboardList",
    sections: [
      { shortCode: "exam_group", label: "Exam Group", fields: [text("name", "Name", true), sel("exam_type", "Exam Type", ["Term", "Half Yearly", "Annual", "Unit Test"]), description()] },
      { shortCode: "exam_schedule", label: "Exam Schedule", fields: [text("exam_group", "Exam Group", true), text("name", "Exam Name", true), classField(), sectionField(), text("subject", "Subject"), dateF("date", "Date"), timeF("start_time", "Start Time"), timeF("end_time", "End Time"), num("max_marks", "Max Marks")] },
      { shortCode: "exam_result", label: "Exam Result", fields: [text("exam_group", "Exam Group", true), text("student", "Student", true), classField(), text("subject", "Subject"), num("marks_obtained", "Marks Obtained"), num("max_marks", "Max Marks"), num("percentage", "Percentage")] },
      { shortCode: "design_admit_card", label: "Design Admit Card", fields: [text("template_name", "Template Name", true), text("exam_group", "Exam Group"), classField(), note()] },
      { shortCode: "print_admit_card", label: "Print Admit Card", fields: [text("exam_group", "Exam Group"), classField(), sectionField(), note()] },
      { shortCode: "design_marksheet", label: "Design Marksheet", fields: [text("template_name", "Template Name", true), text("exam_group", "Exam Group"), classField(), note()] },
      { shortCode: "print_marksheet", label: "Print Marksheet", fields: [text("exam_group", "Exam Group"), classField(), sectionField(), note()] },
      { shortCode: "marks_grade", label: "Marks Grade", fields: [text("grade_name", "Grade Name", true), num("min_percentage", "Min %"), num("max_percentage", "Max %"), description()] },
      { shortCode: "marks_division", label: "Marks Division", fields: [text("division_name", "Division Name", true), num("min_percentage", "Min %"), num("max_percentage", "Max %"), description()] },
    ],
  },
  {
    shortCode: "online_examination",
    label: "Online Examinations",
    icon: "MonitorPlay",
    sections: [
      { shortCode: "online_exam", label: "Online Exam", fields: [text("exam_name", "Exam Name", true), text("subject", "Subject"), num("duration_minutes", "Duration (min)"), num("total_questions", "Total Questions"), dateF("date", "Date"), description()] },
      { shortCode: "question_bank", label: "Question Bank", fields: [area("question", "Question", ), text("subject", "Subject", true), sel("question_type", "Question Type", ["MCQ", "Short Answer", "Long Answer", "True/False"]), text("option_a", "Option A"), text("option_b", "Option B"), text("option_c", "Option C"), text("option_d", "Option D"), text("correct_answer", "Correct Answer"), num("marks", "Marks")] },
    ],
  },
  {
    shortCode: "lesson_plan",
    label: "Lesson Plan",
    icon: "BookOpen",
    sections: [
      { shortCode: "copy_old_lessons", label: "Copy Old Lessons", fields: [text("from_class", "From Class"), text("to_class", "To Class"), text("subject", "Subject"), note()] },
      { shortCode: "manage_lesson_plan", label: "Manage Lesson Plan", fields: [classField(), sectionField(), text("subject", "Subject"), text("lesson", "Lesson"), text("topic", "Topic"), dateF("date", "Date"), sel("status", "Status", ["Pending", "In Progress", "Completed"])] },
      { shortCode: "manage_syllabus_status", label: "Manage Syllabus Status", fields: [classField(), sectionField(), text("subject", "Subject"), sel("status", "Status", ["Pending", "In Progress", "Completed"]), dateF("completion_date", "Completion Date")] },
      { shortCode: "lesson", label: "Lesson", fields: [text("lesson_name", "Lesson Name", true), text("subject", "Subject"), classField(), description()] },
      { shortCode: "topic", label: "Topic", fields: [text("topic_name", "Topic Name", true), text("lesson", "Lesson"), classField(), text("subject", "Subject"), description()] },
    ],
  },
  {
    shortCode: "academics",
    label: "Academics",
    icon: "School",
    sections: [
      { shortCode: "class_timetable", label: "Class Timetable", fields: [classField(), sectionField(), sel("day", "Day", DAYS, true), text("subject", "Subject"), text("teacher", "Teacher"), timeF("start_time", "Start Time"), timeF("end_time", "End Time"), text("room", "Room")] },
      { shortCode: "teachers_timetable", label: "Teachers Timetable", fields: [text("teacher", "Teacher", true), classField(), sectionField(), sel("day", "Day", DAYS), timeF("start_time", "Start Time"), timeF("end_time", "End Time")] },
      { shortCode: "assign_class_teacher", label: "Assign Class Teacher", fields: [classField(), sectionField(), text("teacher", "Teacher", true)] },
      { shortCode: "promote_students", label: "Promote Students", fields: [text("from_class", "From Class"), text("to_class", "To Class"), sectionField(), note()] },
      { shortCode: "subject_group", label: "Subject Group", fields: [text("name", "Name", true), text("sections", "Sections"), description()] },
      { shortCode: "subjects", label: "Subjects", fields: [text("subject_name", "Subject Name", true), text("subject_code", "Subject Code"), sel("subject_type", "Subject Type", ["Theory", "Practical"]), text("teacher", "Teacher"), classField()] },
      { shortCode: "class", label: "Class", fields: [text("class_name", "Class Name", true), text("sections", "Sections"), note()] },
      { shortCode: "sections", label: "Sections", fields: [text("section_name", "Section Name", true), text("class", "Class"), note()] },
    ],
  },
  {
    shortCode: "human_resource",
    label: "Human Resource",
    icon: "Users",
    sections: [
      { shortCode: "staff_directory", label: "Staff Directory", fields: [text("employee_id", "Employee ID", true), text("name", "Name", true), sel("role", "Role", ["Teacher", "Accountant", "Librarian", "Admin", "Support", "Driver"]), text("department", "Department"), text("designation", "Designation"), phoneF("mobile", "Mobile"), emailF("email", "Email"), dateF("joining_date", "Joining Date"), money("basic_salary", "Basic Salary")] },
      { shortCode: "staff_attendance", label: "Staff Attendance", fields: [text("staff", "Staff", true), dateF("date", "Date"), sel("status", "Status", ["Present", "Absent", "Late", "Half Day", "Leave"]), note()] },
      { shortCode: "payroll", label: "Payroll", fields: [text("staff", "Staff", true), text("payslip_no", "Payslip No"), text("month", "Month"), money("basic_salary", "Basic Salary"), money("allowances", "Allowances"), money("deductions", "Deductions"), money("net_salary", "Net Salary"), dateF("payment_date", "Payment Date")] },
      { shortCode: "approve_leave_request", label: "Approve Leave Request", fields: [text("staff", "Staff", true), dateF("from_date", "From Date"), dateF("to_date", "To Date"), area("reason", "Reason"), sel("status", "Status", ["Pending", "Approved", "Rejected"])] },
      { shortCode: "apply_leave", label: "Apply Leave", fields: [text("staff", "Staff", true), text("leave_type", "Leave Type"), dateF("from_date", "From Date"), dateF("to_date", "To Date"), area("reason", "Reason")] },
      { shortCode: "leave_type", label: "Leave Type", fields: [text("name", "Name", true), description()] },
      { shortCode: "teachers_rating", label: "Teachers Rating", fields: [text("teacher", "Teacher", true), num("rating", "Rating"), area("comment", "Comment")] },
      { shortCode: "department", label: "Department", fields: [text("name", "Name", true), description()] },
      { shortCode: "designation", label: "Designation", fields: [text("name", "Name", true), description()] },
      { shortCode: "disabled_staff", label: "Disabled Staff", fields: [text("staff", "Staff", true), text("reason", "Reason"), dateF("date", "Date")] },
    ],
  },
  {
    shortCode: "communicate",
    label: "Communicate",
    icon: "Send",
    sections: [
      { shortCode: "notice_board", label: "Notice Board", fields: [text("title", "Title", true), dateF("date", "Date"), sel("audience", "Audience", ["All", "Students", "Parents", "Staff"], true), area("message", "Message"), text("attachment", "Attachment")] },
      { shortCode: "send_email", label: "Send Email", fields: [text("recipient", "Recipient", true), text("subject", "Subject"), area("message", "Message"), dateF("date", "Date")] },
      { shortCode: "send_sms", label: "Send SMS", fields: [text("recipient", "Recipient"), phoneF("mobile", "Mobile", ), area("message", "Message"), dateF("date", "Date")] },
      { shortCode: "email_sms_log", label: "Email / SMS Log", fields: [text("recipient", "Recipient"), sel("type", "Type", ["Email", "SMS"]), text("subject", "Subject"), dateF("date", "Date"), sel("status", "Status", ["Sent", "Failed", "Pending"])] },
      { shortCode: "schedule_email_sms_log", label: "Schedule Email SMS Log", fields: [text("recipient", "Recipient"), sel("type", "Type", ["Email", "SMS"]), text("subject", "Subject"), dateF("scheduled_at", "Scheduled At"), sel("status", "Status", ["Scheduled", "Sent", "Failed"])] },
      { shortCode: "login_credential_send", label: "Login Credential Send", fields: [sel("role", "Role", ["Student", "Parent", "Staff"]), emailF("email", "Email"), phoneF("mobile", "Mobile"), note()] },
      { shortCode: "email_template", label: "Email Template", fields: [text("title", "Title", true), text("subject", "Subject"), area("body", "Body")] },
      { shortCode: "sms_template", label: "SMS Template", fields: [text("title", "Title", true), area("message", "Message")] },
    ],
  },
  {
    shortCode: "download_center",
    label: "Download Center",
    icon: "Download",
    sections: [
      { shortCode: "content_type", label: "Content Type", fields: [text("name", "Name", true), description()] },
      { shortCode: "content_share_list", label: "Content Share List", fields: [text("title", "Title", true), text("content_type", "Content Type"), classField(), dateF("date", "Date"), note()] },
      { shortCode: "upload_content", label: "Upload Content", fields: [text("title", "Title", true), text("content_type", "Content Type"), classField(), text("file", "File"), dateF("date", "Date")] },
      { shortCode: "video_tutorial", label: "Video Tutorial", fields: [text("title", "Title", true), text("url", "Video URL"), description()] },
    ],
  },
  {
    shortCode: "homework",
    label: "Homework",
    icon: "NotebookPen",
    sections: [
      { shortCode: "add_homework", label: "Add Homework", fields: [classField(), sectionField(), text("subject", "Subject", true), dateF("homework_date", "Homework Date"), dateF("submission_date", "Submission Date"), area("description", "Description")] },
      { shortCode: "daily_assignment", label: "Daily Assignment", fields: [classField(), sectionField(), text("subject", "Subject", true), text("title", "Title"), dateF("date", "Date"), area("description", "Description")] },
    ],
  },
  {
    shortCode: "library",
    label: "Library",
    icon: "Library",
    sections: [
      { shortCode: "book_list", label: "Book List", fields: [text("title", "Book Title", true), text("author", "Author"), text("isbn", "ISBN"), text("category", "Category"), text("publisher", "Publisher"), num("quantity", "Quantity"), num("available", "Available")] },
      { shortCode: "issue_return", label: "Issue Return", fields: [text("book", "Book", true), text("student", "Issued To"), dateF("issue_date", "Issue Date"), dateF("due_date", "Due Date"), dateF("return_date", "Return Date"), sel("status", "Status", ["Issued", "Returned", "Overdue"])] },
      { shortCode: "add_student", label: "Add Student", fields: [text("student", "Student", true), text("library_card_no", "Library Card No"), dateF("date", "Date")] },
      { shortCode: "add_staff_member", label: "Add Staff Member", fields: [text("staff", "Staff", true), text("library_card_no", "Library Card No"), dateF("date", "Date")] },
    ],
  },
  {
    shortCode: "inventory",
    label: "Inventory",
    icon: "Package",
    sections: [
      { shortCode: "issue_item", label: "Issue Item", fields: [text("item", "Item", true), text("item_category", "Item Category"), text("issue_to", "Issue To"), dateF("issue_date", "Issue Date"), dateF("return_date", "Return Date"), num("quantity", "Quantity"), sel("status", "Status", ["Issued", "Returned"])] },
      { shortCode: "add_item_stock", label: "Add Item Stock", fields: [text("item", "Item", true), text("supplier", "Supplier"), text("store", "Store"), num("quantity", "Quantity"), dateF("date", "Date"), note()] },
      { shortCode: "add_item", label: "Add Item", fields: [text("item_name", "Item Name", true), text("item_category", "Item Category"), description(), text("unit", "Unit"), num("quantity", "Quantity")] },
      { shortCode: "item_category", label: "Item Category", fields: [text("name", "Name", true), description()] },
      { shortCode: "item_store", label: "Item Store", fields: [text("store_name", "Store Name", true), description()] },
      { shortCode: "item_supplier", label: "Item Supplier", fields: [text("supplier_name", "Supplier Name", true), phoneF("phone", "Phone"), emailF("email", "Email"), area("address", "Address"), text("contact_person", "Contact Person")] },
    ],
  },
  {
    shortCode: "transport",
    label: "Transport",
    icon: "Bus",
    sections: [
      { shortCode: "transport_fees_master", label: "Fees Master", fields: [text("route", "Route"), text("vehicle", "Vehicle"), money("amount", "Amount"), description()] },
      { shortCode: "pickup_point", label: "Pickup Point", fields: [text("name", "Name", true), text("route", "Route"), money("fare", "Fare"), description()] },
      { shortCode: "routes", label: "Routes", fields: [text("route_name", "Route Name", true), description()] },
      { shortCode: "vehicles", label: "Vehicles", fields: [text("vehicle_no", "Vehicle No", true), text("vehicle_model", "Vehicle Model"), text("driver_name", "Driver Name"), text("driver_license", "Driver License"), num("capacity", "Capacity")] },
      { shortCode: "assign_vehicle", label: "Assign Vehicle", fields: [text("route", "Route", true), text("vehicle", "Vehicle"), text("driver", "Driver"), note()] },
      { shortCode: "route_pickup_point", label: "Route Pickup Point", fields: [text("route", "Route", true), text("pickup_point", "Pickup Point"), note()] },
      { shortCode: "student_transport_fees", label: "Student Transport Fees", fields: [text("student", "Student", true), text("route", "Route"), text("pickup_point", "Pickup Point"), money("amount", "Amount"), note()] },
    ],
  },
  {
    shortCode: "hostel",
    label: "Hostel",
    icon: "BedDouble",
    sections: [
      { shortCode: "hostel_rooms", label: "Hostel Rooms", fields: [text("room_no", "Room No", true), text("hostel", "Hostel"), text("room_type", "Room Type"), num("no_of_beds", "No. of Beds"), money("cost_per_bed", "Cost Per Bed")] },
      { shortCode: "room_type", label: "Room Type", fields: [text("type_name", "Type Name", true), description()] },
      { shortCode: "hostel", label: "Hostel", fields: [text("hostel_name", "Hostel Name", true), sel("type", "Type", ["Boys", "Girls"]), area("address", "Address"), note()] },
    ],
  },
  {
    shortCode: "certificate",
    label: "Certificate",
    icon: "Award",
    sections: [
      { shortCode: "student_certificate", label: "Student Certificate", fields: [text("student", "Student", true), text("certificate_type", "Certificate Type"), dateF("date", "Date"), note()] },
      { shortCode: "generate_certificate", label: "Generate Certificate", fields: [text("student", "Student", true), text("certificate_type", "Certificate Type"), dateF("date", "Date")] },
      { shortCode: "student_id_card", label: "Student ID Card", fields: [text("student", "Student", true), text("card_template", "Card Template"), dateF("date", "Date")] },
      { shortCode: "generate_id_card", label: "Generate ID Card", fields: [text("student", "Student", true), text("card_template", "Card Template"), dateF("date", "Date")] },
      { shortCode: "staff_id_card", label: "Staff ID Card", fields: [text("staff", "Staff", true), text("card_template", "Card Template"), dateF("date", "Date")] },
      { shortCode: "generate_staff_id_card", label: "Generate Staff ID Card", fields: [text("staff", "Staff", true), text("card_template", "Card Template"), dateF("date", "Date")] },
    ],
  },
  {
    shortCode: "front_cms",
    label: "Front CMS",
    icon: "Globe",
    sections: [
      { shortCode: "event", label: "Event", fields: [text("title", "Title", true), dateF("start_date", "Start Date"), dateF("end_date", "End Date"), text("venue", "Venue"), description()] },
      { shortCode: "gallery", label: "Gallery", fields: [text("title", "Title", true), dateF("date", "Date"), description()] },
      { shortCode: "news", label: "News", fields: [text("title", "Title", true), dateF("date", "Date"), description()] },
      { shortCode: "media_manager", label: "Media Manager", fields: [text("title", "Title", true), sel("type", "Type", ["Image", "Video", "Document"]), text("url", "URL"), dateF("date", "Date")] },
      { shortCode: "pages", label: "Pages", fields: [text("title", "Title", true), text("slug", "Slug"), area("content", "Content"), status()] },
      { shortCode: "menus", label: "Menus", fields: [text("menu_title", "Menu Title", true), text("link", "Link"), num("order", "Order"), status()] },
      { shortCode: "banner_images", label: "Banner Images", fields: [text("title", "Title", true), text("image", "Image"), text("link", "Link"), status()] },
    ],
  },
  {
    shortCode: "alumni",
    label: "Alumni",
    icon: "UserRoundCheck",
    sections: [
      { shortCode: "manage_alumni", label: "Manage Alumni", fields: [text("name", "Name", true), sel("gender", "Gender", GENDERS), text("class", "Class"), text("year_passed", "Year Passed"), phoneF("mobile", "Mobile"), emailF("email", "Email"), text("profession", "Profession")] },
      { shortCode: "events", label: "Events", fields: [text("title", "Title", true), dateF("date", "Date"), text("venue", "Venue"), description()] },
    ],
  },
  {
    shortCode: "reports",
    label: "Reports",
    icon: "BarChart3",
    sections: [
      { shortCode: "report_student_information", label: "Student Information", fields: [classField(), sectionField(), dateF("from_date", "From Date"), dateF("to_date", "To Date"), note()] },
      { shortCode: "report_finance", label: "Finance", fields: [dateF("from_date", "From Date"), dateF("to_date", "To Date"), text("fees_group", "Fees Group"), note()] },
      { shortCode: "report_attendance", label: "Attendance", fields: [classField(), sectionField(), dateF("from_date", "From Date"), dateF("to_date", "To Date")] },
      { shortCode: "report_examinations", label: "Examinations", fields: [text("exam_group", "Exam Group"), classField(), dateF("from_date", "From Date"), dateF("to_date", "To Date")] },
      { shortCode: "report_online_examinations", label: "Online Examinations", fields: [text("online_exam", "Online Exam"), dateF("from_date", "From Date"), dateF("to_date", "To Date")] },
      { shortCode: "report_lesson_plan", label: "Lesson Plan", fields: [classField(), text("subject", "Subject"), dateF("from_date", "From Date"), dateF("to_date", "To Date")] },
      { shortCode: "report_human_resource", label: "Human Resource", fields: [text("department", "Department"), dateF("from_date", "From Date"), dateF("to_date", "To Date")] },
      { shortCode: "report_homework", label: "Homework", fields: [classField(), dateF("from_date", "From Date"), dateF("to_date", "To Date")] },
      { shortCode: "report_library", label: "Library", fields: [dateF("from_date", "From Date"), dateF("to_date", "To Date"), text("book", "Book")] },
      { shortCode: "report_inventory", label: "Inventory", fields: [text("item_category", "Item Category"), dateF("from_date", "From Date"), dateF("to_date", "To Date")] },
      { shortCode: "report_transport", label: "Transport", fields: [text("route", "Route"), dateF("from_date", "From Date"), dateF("to_date", "To Date")] },
      { shortCode: "report_hostel", label: "Hostel", fields: [text("hostel", "Hostel"), dateF("from_date", "From Date"), dateF("to_date", "To Date")] },
      { shortCode: "report_alumni", label: "Alumni", fields: [text("year_passed", "Year Passed"), dateF("from_date", "From Date"), dateF("to_date", "To Date")] },
      { shortCode: "user_log", label: "User Log", fields: [text("user", "User"), dateF("date", "Date"), text("action", "Action")] },
      { shortCode: "audit_trail_report", label: "Audit Trail Report", fields: [text("user", "User"), text("action", "Action"), dateF("from_date", "From Date"), dateF("to_date", "To Date")] },
    ],
  },
  {
    shortCode: "system_settings",
    label: "System Settings",
    icon: "Settings",
    sections: [
      { shortCode: "general_setting", label: "General Setting", fields: [text("school_name", "School Name", true), area("address", "Address"), phoneF("phone", "Phone"), emailF("email", "Email"), text("session", "Session"), text("logo", "Logo URL")] },
      { shortCode: "session_setting", label: "Session Setting", fields: [text("session", "Session", true), dateF("start_date", "Start Date"), dateF("end_date", "End Date"), status()] },
      { shortCode: "notification_setting", label: "Notification Setting", fields: [text("event", "Event", true), check("email", "Email"), check("sms", "SMS"), status()] },
      { shortCode: "sms_setting", label: "SMS Setting", fields: [text("gateway", "Gateway"), text("api_key", "API Key"), text("sender_id", "Sender ID"), status()] },
      { shortCode: "email_setting", label: "Email Setting", fields: [text("smtp_host", "SMTP Host"), num("smtp_port", "SMTP Port"), text("smtp_user", "SMTP User"), text("smtp_pass", "SMTP Password"), emailF("from_email", "From Email")] },
      { shortCode: "payment_methods", label: "Payment Methods", fields: [text("method", "Method", true), area("config", "Config"), status()] },
      { shortCode: "print_header_footer", label: "Print Header Footer", fields: [area("header", "Header"), area("footer", "Footer"), text("setting", "Setting")] },
      { shortCode: "front_cms_setting", label: "Front CMS Setting", fields: [text("site_title", "Site Title"), emailF("email", "Email"), phoneF("phone", "Phone"), area("address", "Address"), status()] },
      { shortCode: "roles_permissions", label: "Roles Permissions", fields: [text("role_name", "Role Name", true), text("permissions", "Permissions"), description()] },
      { shortCode: "backup_restore", label: "Backup / Restore", fields: [text("backup_name", "Backup Name", true), dateF("date", "Date"), note()] },
      { shortCode: "languages", label: "Languages", fields: [text("language", "Language", true), text("short_code", "Short Code"), status()] },
      { shortCode: "currency", label: "Currency", fields: [text("currency", "Currency", true), text("symbol", "Symbol"), num("exchange_rate", "Exchange Rate"), status()] },
      { shortCode: "users", label: "Users", fields: [text("name", "Name", true), emailF("email", "Email"), sel("role", "Role", ["Administrator", "Principal", "Accountant", "Librarian", "Teacher", "Staff"]), phoneF("phone", "Phone"), status()] },
      { shortCode: "modules", label: "Modules", fields: [text("module_name", "Module Name", true), text("short_code", "Short Code"), check("is_addon", "Is Add-on"), status()] },
      { shortCode: "custom_fields", label: "Custom Fields", fields: [text("field_name", "Field Name", true), text("module", "Module"), sel("field_type", "Field Type", ["Text", "Number", "Date", "Select", "Checkbox"]), text("options", "Options")] },
      { shortCode: "captcha_setting", label: "Captcha Setting", fields: [text("site_key", "Site Key"), text("secret_key", "Secret Key"), status()] },
      { shortCode: "system_fields", label: "System Fields", fields: [text("field_name", "Field Name", true), text("module", "Module"), status()] },
      { shortCode: "student_profile_update", label: "Student Profile Update", fields: [classField(), note(), status()] },
      { shortCode: "online_admission_setting", label: "Online Admission", fields: [text("title", "Title", true), description(), status()] },
      { shortCode: "file_types", label: "File Types", fields: [text("file_type", "File Type", true), text("mime_type", "MIME Type"), text("extension", "Extension")] },
      { shortCode: "system_update", label: "System Update", fields: [text("version", "Version", true), dateF("date", "Date"), note()] },
      { shortCode: "sidebar_menu", label: "Sidebar Menu", fields: [text("module", "Module", true), text("submenu", "Submenu"), text("url", "URL"), text("permission_group", "Permission Group"), status()] },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Add-on modules (visible only when enabled)                                 */
/* -------------------------------------------------------------------------- */

export const ADDON_MODULES: ModuleDef[] = [
  {
    shortCode: "gmeet_live_classes",
    label: "Gmeet Live Classes",
    icon: "Video",
    isAddon: true,
    sections: [
      { shortCode: "gmeet_timetable", label: "Timetable", fields: [classField(), sectionField(), text("meeting_title", "Meeting Title", true), dateF("date", "Date"), timeF("start_time", "Start Time"), text("meeting_link", "Meeting Link")] },
      { shortCode: "gmeet_meeting", label: "Meeting", fields: [text("title", "Title", true), text("class", "Class"), dateF("date", "Date"), text("meeting_link", "Meeting Link"), sel("status", "Status", ["Scheduled", "Live", "Completed"])] },
      { shortCode: "gmeet_class_report", label: "Class Report", fields: [classField(), text("meeting", "Meeting"), num("attendance_count", "Attendance Count"), dateF("date", "Date")] },
      { shortCode: "gmeet_meeting_report", label: "Meeting Report", fields: [text("meeting", "Meeting", true), num("duration_minutes", "Duration (min)"), num("participants", "Participants"), dateF("date", "Date")] },
    ],
  },
  {
    shortCode: "zoom_live_classes",
    label: "Zoom Live Classes",
    icon: "Video",
    isAddon: true,
    sections: [
      { shortCode: "zoom_timetable", label: "Timetable", fields: [classField(), sectionField(), text("meeting_title", "Meeting Title", true), dateF("date", "Date"), timeF("start_time", "Start Time"), text("meeting_link", "Meeting Link")] },
      { shortCode: "zoom_meeting", label: "Meeting", fields: [text("title", "Title", true), text("class", "Class"), dateF("date", "Date"), text("meeting_link", "Meeting Link"), sel("status", "Status", ["Scheduled", "Live", "Completed"])] },
      { shortCode: "zoom_class_report", label: "Class Report", fields: [classField(), text("meeting", "Meeting"), num("attendance_count", "Attendance Count"), dateF("date", "Date")] },
      { shortCode: "zoom_meeting_report", label: "Meeting Report", fields: [text("meeting", "Meeting", true), num("duration_minutes", "Duration (min)"), num("participants", "Participants"), dateF("date", "Date")] },
    ],
  },
  {
    shortCode: "behaviour_records",
    label: "Behaviour Records",
    icon: "Smile",
    isAddon: true,
    sections: [
      { shortCode: "student_incidents", label: "Student Incidents", fields: [text("student", "Student", true), text("incident", "Incident"), sel("severity", "Severity", ["Low", "Medium", "High"]), dateF("date", "Date"), area("description", "Description")] },
      { shortCode: "incidents", label: "Incidents", fields: [text("title", "Title", true), sel("points", "Points", ["Positive", "Negative"]), num("score", "Score"), description()] },
      { shortCode: "behaviour_report", label: "Report", fields: [text("student", "Student"), dateF("from_date", "From Date"), dateF("to_date", "To Date")] },
      { shortCode: "behaviour_setting", label: "Setting", fields: [check("enable", "Enable Behaviour Records"), status()] },
    ],
  },
  {
    shortCode: "multi_branch",
    label: "Multi Branch",
    icon: "Network",
    isAddon: true,
    sections: [
      { shortCode: "branch_overview", label: "Branch Overview", fields: [text("branch", "Branch", true), text("principal", "Principal"), num("students", "Students"), num("staff", "Staff"), status()] },
      { shortCode: "branch_finance", label: "Finance", fields: [text("branch", "Branch", true), money("income", "Income"), money("expense", "Expense"), dateF("date", "Date")] },
    ],
  },
  {
    shortCode: "two_factor_auth",
    label: "Two Factor Authentication",
    icon: "ShieldCheck",
    isAddon: true,
    sections: [
      { shortCode: "tfa_setup", label: "Setup", fields: [check("enabled", "Enable 2FA"), sel("method", "Method", ["Authenticator App", "Email OTP", "SMS OTP"]), status()] },
    ],
  },
  {
    shortCode: "online_course",
    label: "Online Course",
    icon: "Presentation",
    isAddon: true,
    sections: [
      { shortCode: "course", label: "Course", fields: [text("title", "Title", true), text("category", "Category"), text("instructor", "Instructor"), money("price", "Price"), description()] },
      { shortCode: "course_category", label: "Course Category", fields: [text("name", "Name", true), description()] },
      { shortCode: "course_report", label: "Course Report", fields: [text("course", "Course"), num("enrolled", "Enrolled"), num("completed", "Completed"), dateF("from_date", "From Date"), dateF("to_date", "To Date")] },
      { shortCode: "course_offline_payment", label: "Offline Payment", fields: [text("student", "Student"), text("course", "Course"), money("amount", "Amount"), dateF("date", "Date"), note()] },
      { shortCode: "course_exam_question", label: "Course Exam Question", fields: [text("course", "Course"), area("question", "Question"), text("correct_answer", "Correct Answer"), num("marks", "Marks")] },
      { shortCode: "course_tag", label: "Course Tag", fields: [text("name", "Name", true), description()] },
    ],
  },
  {
    shortCode: "cbse_exam",
    label: "CBSE Exam",
    icon: "FileSpreadsheet",
    isAddon: true,
    sections: [
      { shortCode: "cbse_exam", label: "Exam", fields: [text("name", "Name", true), classField(), dateF("date", "Date"), description()] },
      { shortCode: "cbse_result", label: "Result", fields: [text("student", "Student", true), text("exam", "Exam"), num("marks_obtained", "Marks Obtained"), num("max_marks", "Max Marks")] },
      { shortCode: "cbse_grade", label: "Grade", fields: [text("grade", "Grade", true), num("min_percentage", "Min %"), num("max_percentage", "Max %")] },
      { shortCode: "cbse_observation", label: "Observation", fields: [text("student", "Student", true), text("observation", "Observation"), text("remark", "Remark")] },
      { shortCode: "cbse_observation_parameter", label: "Observation Parameter", fields: [text("name", "Name", true), description()] },
      { shortCode: "cbse_assessment", label: "Assessment", fields: [text("name", "Name", true), text("term", "Term"), num("max_marks", "Max Marks")] },
      { shortCode: "cbse_term", label: "Term", fields: [text("name", "Name", true), dateF("start_date", "Start Date"), dateF("end_date", "End Date")] },
      { shortCode: "cbse_template", label: "Template", fields: [text("name", "Name", true), classField(), note()] },
      { shortCode: "cbse_report", label: "Report", fields: [classField(), text("exam", "Exam"), dateF("from_date", "From Date"), dateF("to_date", "To Date")] },
      { shortCode: "cbse_setting", label: "Setting", fields: [check("enable", "Enable CBSE Exam"), status()] },
    ],
  },
  {
    shortCode: "qr_attendance",
    label: "QR Code Attendance",
    icon: "QrCode",
    isAddon: true,
    sections: [
      { shortCode: "qr_attendance", label: "Attendance", fields: [text("student", "Student", true), text("qr_code", "QR Code"), dateF("date", "Date"), sel("status", "Status", ["Present", "Absent"])] },
      { shortCode: "qr_setting", label: "Setting", fields: [check("enable", "Enable QR Attendance"), num("expiry_minutes", "QR Expiry (min)"), status()] },
    ],
  },
  {
    shortCode: "holiday",
    label: "Holiday",
    icon: "Palmtree",
    isAddon: true,
    sections: [
      { shortCode: "holiday", label: "Holiday", fields: [text("title", "Title", true), text("holiday_type", "Holiday Type"), dateF("from_date", "From Date"), dateF("to_date", "To Date"), description()] },
      { shortCode: "holiday_type", label: "Holiday Type", fields: [text("name", "Name", true), description()] },
    ],
  },
  {
    shortCode: "student_cv",
    label: "Student CV",
    icon: "FileText",
    isAddon: true,
    sections: [
      { shortCode: "student_cv_resume", label: "Resume", fields: [text("student", "Student", true), text("title", "Title"), area("summary", "Summary"), area("skills", "Skills"), area("education", "Education")] },
      { shortCode: "student_cv_generate", label: "Generate", fields: [text("student", "Student", true), text("template", "Template"), dateF("date", "Date")] },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Student / parent panel (permission_student)                                */
/* -------------------------------------------------------------------------- */

export const STUDENT_PANEL_MODULE: ModuleDef = {
  shortCode: "student_panel",
  label: "Student / Parent Panel",
  icon: "LayoutDashboard",
  isStudentPanel: true,
  sections: [
    { shortCode: "sp_fees", label: "Fees", fields: [text("term", "Term"), money("amount", "Amount"), dateF("due_date", "Due Date"), sel("status", "Status", ["Paid", "Pending"])] },
    { shortCode: "sp_class_timetable", label: "Class Timetable", fields: [sel("day", "Day", DAYS), text("subject", "Subject"), timeF("start_time", "Start Time"), timeF("end_time", "End Time")] },
    { shortCode: "sp_homework", label: "Homework", fields: [text("subject", "Subject"), dateF("date", "Date"), area("description", "Description")] },
    { shortCode: "sp_download_center", label: "Download Center", fields: [text("title", "Title"), text("file", "File"), dateF("date", "Date")] },
    { shortCode: "sp_attendance", label: "Attendance", fields: [dateF("date", "Date"), sel("status", "Status", ["Present", "Absent", "Late"])] },
    { shortCode: "sp_examinations", label: "Examinations", fields: [text("exam", "Exam"), text("subject", "Subject"), num("marks", "Marks"), num("max_marks", "Max Marks")] },
    { shortCode: "sp_notice_board", label: "Notice Board", fields: [text("title", "Title"), dateF("date", "Date"), area("message", "Message")] },
    { shortCode: "sp_library", label: "Library", fields: [text("book", "Book"), dateF("issue_date", "Issue Date"), dateF("due_date", "Due Date"), sel("status", "Status", ["Issued", "Returned"])] },
    { shortCode: "sp_transport_routes", label: "Transport Routes", fields: [text("route", "Route"), text("pickup_point", "Pickup Point"), money("fare", "Fare")] },
    { shortCode: "sp_hostel_rooms", label: "Hostel Rooms", fields: [text("room", "Room"), text("room_type", "Room Type"), money("cost", "Cost")] },
    { shortCode: "sp_calendar_todo", label: "Calendar To Do List", fields: [text("title", "Title", true), dateF("date", "Date"), sel("priority", "Priority", ["Low", "Medium", "High"]), sel("status", "Status", ["Pending", "Done"])] },
    { shortCode: "sp_online_examination", label: "Online Examination", fields: [text("exam", "Exam"), dateF("date", "Date"), num("score", "Score"), sel("status", "Status", ["Pending", "Completed"])] },
    { shortCode: "sp_teachers_rating", label: "Teachers Rating", fields: [text("teacher", "Teacher", true), num("rating", "Rating"), area("comment", "Comment")] },
    { shortCode: "sp_chat", label: "Chat", fields: [text("with", "With"), area("message", "Message"), dateF("date", "Date")] },
    { shortCode: "sp_multi_class", label: "Multi Class", fields: [classField(), sectionField(), text("subject", "Subject")] },
    { shortCode: "sp_lesson_plan", label: "Lesson Plan", fields: [classField(), text("subject", "Subject"), text("lesson", "Lesson"), text("topic", "Topic"), dateF("date", "Date")] },
    { shortCode: "sp_syllabus_status", label: "Syllabus Status", fields: [text("subject", "Subject"), text("lesson", "Lesson"), sel("status", "Status", ["Pending", "In Progress", "Completed"])] },
    { shortCode: "sp_apply_leave", label: "Apply Leave", fields: [dateF("from_date", "From Date"), dateF("to_date", "To Date"), area("reason", "Reason"), sel("status", "Status", ["Pending", "Approved", "Rejected"])] },
    { shortCode: "sp_visitor_book", label: "Visitor Book", fields: [text("name", "Visitor Name"), phoneF("phone", "Phone"), text("purpose", "Purpose"), dateF("date", "Date")] },
    { shortCode: "sp_student_timeline", label: "Student Timeline", fields: [text("title", "Title", true), dateF("date", "Date"), area("description", "Description")] },
  ],
};

/* -------------------------------------------------------------------------- */
/* Lookup helpers                                                             */
/* -------------------------------------------------------------------------- */

export const ALL_MODULES: ModuleDef[] = [...CORE_MODULES, ...ADDON_MODULES, STUDENT_PANEL_MODULE];

const SUBMENU_INDEX = new Map<string, { module: ModuleDef; submenu: SubmenuDef }>();
for (const module of ALL_MODULES) {
  for (const submenu of module.sections) {
    SUBMENU_INDEX.set(submenu.shortCode, { module, submenu });
  }
}

export function findSubmenu(shortCode: string) {
  return SUBMENU_INDEX.get(shortCode);
}

export function findModule(shortCode: string) {
  return ALL_MODULES.find((m) => m.shortCode === shortCode);
}
