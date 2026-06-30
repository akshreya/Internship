require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { sendMail } = require("./mailer");

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, "db.json");

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { otps: {}, pending: [], users: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function todayStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}
function findUser(db, id) {
  return db.users.find((u) => u.id === id);
}


app.post("/api/signup", async (req, res) => {
  const { fname, lname, email, phone, password } = req.body;
  if (!fname || !lname || !email || !phone || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const db = readDB();
  if (db.users.find((u) => u.email === email)) {
    return res.status(400).json({ error: "An account with this email already exists." });
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const passwordHash = await bcrypt.hash(password, 10);

  db.otps[email] = { otp, fname, lname, phone, passwordHash, expiresAt };
  writeDB(db);

  try {
    await sendMail({
      to: email,
      subject: "Your verification code",
      html: `<p>Hi ${fname},</p><p>Your verification code is:</p><h2>${otp}</h2><p>Expires in 10 minutes.</p>`,
    });
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    return res.status(500).json({ error: "Could not send verification email. Check your SMTP settings in .env." });
  }

  res.json({ message: "OTP sent to your email." });
});

app.post("/api/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const db = readDB();
  const record = db.otps[email];

  if (!record) return res.status(400).json({ error: "No pending verification for this email. Please sign up again." });
  if (Date.now() > record.expiresAt) {
    delete db.otps[email];
    writeDB(db);
    return res.status(400).json({ error: "This code expired. Please sign up again." });
  }
  if (record.otp !== otp) return res.status(400).json({ error: "Incorrect code. Please try again." });

  const id = Date.now().toString();
  db.pending.push({
    id,
    fname: record.fname,
    lname: record.lname,
    email,
    phone: record.phone,
    passwordHash: record.passwordHash,
    requestedAt: new Date().toISOString(),
  });
  delete db.otps[email];
  writeDB(db);

  if (process.env.ADMIN_EMAIL) {
    sendMail({
      to: process.env.ADMIN_EMAIL,
      subject: "New account request awaiting approval",
      html: `<p>${record.fname} ${record.lname} (${email}) has requested an account.</p>`,
    }).catch((err) => console.error("Failed to notify admin:", err));
  }

  res.json({ message: "Verified. Your account is pending admin approval." });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Enter your email and password." });

  const db = readDB();
  const user = db.users.find((u) => u.email === email);

  if (!user) {
    const stillPending = db.pending.find((p) => p.email === email);
    if (stillPending) return res.status(403).json({ error: "Your account is still pending admin approval." });
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: "Incorrect email or password." });

  const { passwordHash, ...safeUser } = user;
  res.json({ message: "Login successful.", user: safeUser });
});


app.get("/api/admin/pending", (req, res) => {
  res.json(readDB().pending);
});

app.post("/api/admin/approve/:id", async (req, res) => {
  const { department } = req.body;
  if (!department) return res.status(400).json({ error: "Pick a department before approving." });

  const db = readDB();
  const idx = db.pending.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Request not found." });

  const [request] = db.pending.splice(idx, 1);
  db.users.push({
    ...request,
    department,
    approvedAt: new Date().toISOString(),
    attendance: [], // { date, checkIn, checkOut, workingHours, lateMinutes, status }
    tasks: [], // { id, title, description, priority, deadline, assignedDate, completedDate, status }
    leaves: [], // { id, type, startDate, endDate, reason, status }
    basicSalary: 30000,
    salarySlips: [],
  });
  writeDB(db);

  try {
    await sendMail({
      to: request.email,
      subject: "Your account has been approved",
      html: `<p>Hi ${request.fname},</p><p>Your account has been approved. You can now log in.</p>`,
    });
  } catch (err) {
    console.error("Failed to send approval email:", err);
  }

  res.json({ message: "Approved." });
});

app.post("/api/admin/deny/:id", async (req, res) => {
  const db = readDB();
  const idx = db.pending.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Request not found." });

  const [request] = db.pending.splice(idx, 1);
  writeDB(db);

  try {
    await sendMail({
      to: request.email,
      subject: "Your account request was not approved",
      html: `<p>Hi ${request.fname},</p><p>Unfortunately your account request was not approved. Contact HR for details.</p>`,
    });
  } catch (err) {
    console.error("Failed to send denial email:", err);
  }

  res.json({ message: "Denied." });
});

app.get("/api/admin/employees", (req, res) => {
  res.json(readDB().users);
});

app.delete("/api/admin/employees/:id", (req, res) => {
  const db = readDB();
  const idx = db.users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Employee not found." });
  db.users.splice(idx, 1);
  writeDB(db);
  res.json({ message: "Employee removed." });
});


const SHIFT_START_MINUTES = 9 * 60 + 30; // 9:30 AM
function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

app.get("/api/employee/:id/attendance", (req, res) => {
  const user = findUser(readDB(), req.params.id);
  if (!user) return res.status(404).json({ error: "Employee not found." });
  res.json(user.attendance || []);
});

app.post("/api/employee/:id/attendance/checkin", (req, res) => {
  const db = readDB();
  const user = findUser(db, req.params.id);
  if (!user) return res.status(404).json({ error: "Employee not found." });

  const today = todayStr();
  if (!user.attendance) user.attendance = [];
  let record = user.attendance.find((a) => a.date === today);
  if (record && record.checkIn) return res.status(400).json({ error: "Already checked in today." });

  const now = new Date();
  const lateMinutes = Math.max(0, minutesSinceMidnight(now) - SHIFT_START_MINUTES);

  if (!record) {
    record = { date: today, checkIn: now.toISOString(), checkOut: null, workingHours: 0, lateMinutes, status: "present" };
    user.attendance.push(record);
  } else {
    record.checkIn = now.toISOString();
    record.lateMinutes = lateMinutes;
    record.status = "present";
  }
  writeDB(db);
  res.json(user.attendance);
});

app.post("/api/employee/:id/attendance/checkout", (req, res) => {
  const db = readDB();
  const user = findUser(db, req.params.id);
  if (!user) return res.status(404).json({ error: "Employee not found." });

  const today = todayStr();
  const record = (user.attendance || []).find((a) => a.date === today);
  if (!record || !record.checkIn) return res.status(400).json({ error: "Check in first." });
  if (record.checkOut) return res.status(400).json({ error: "Already checked out today." });

  const now = new Date();
  record.checkOut = now.toISOString();
  const hours = (now - new Date(record.checkIn)) / (1000 * 60 * 60);
  record.workingHours = Math.round(hours * 10) / 10;
  if (record.workingHours < 4) record.status = "half-day";

  writeDB(db);
  res.json(user.attendance);
});


app.get("/api/employee/:id/leaves", (req, res) => {
  const user = findUser(readDB(), req.params.id);
  if (!user) return res.status(404).json({ error: "Employee not found." });
  res.json(user.leaves || []);
});

app.post("/api/employee/:id/leaves", (req, res) => {
  const { type, startDate, endDate, reason } = req.body;
  if (!type || !startDate || !endDate) {
    return res.status(400).json({ error: "Type, start date, and end date are required." });
  }

  const db = readDB();
  const user = findUser(db, req.params.id);
  if (!user) return res.status(404).json({ error: "Employee not found." });

  if (!user.leaves) user.leaves = [];
  user.leaves.push({
    id: Date.now().toString(),
    type,
    startDate,
    endDate,
    reason: reason || "",
    status: "pending",
    requestedAt: new Date().toISOString(),
  });
  writeDB(db);
  res.json(user.leaves);
});

app.get("/api/admin/leaves", (req, res) => {
  const db = readDB();
  const all = [];
  db.users.forEach((u) => {
    (u.leaves || []).forEach((l) => all.push({ ...l, employeeId: u.id, employeeName: `${u.fname} ${u.lname}` }));
  });
  res.json(all);
});

app.post("/api/admin/leaves/:employeeId/:leaveId/:action", async (req, res) => {
  const { employeeId, leaveId, action } = req.params;
  if (!["approve", "deny"].includes(action)) return res.status(400).json({ error: "Invalid action." });

  const db = readDB();
  const user = findUser(db, employeeId);
  if (!user) return res.status(404).json({ error: "Employee not found." });

  const leave = (user.leaves || []).find((l) => l.id === leaveId);
  if (!leave) return res.status(404).json({ error: "Leave request not found." });

  leave.status = action === "approve" ? "approved" : "denied";
  writeDB(db);

  sendMail({
    to: user.email,
    subject: `Your leave request was ${leave.status}`,
    html: `<p>Hi ${user.fname},</p><p>Your ${leave.type} leave (${leave.startDate} to ${leave.endDate}) was <b>${leave.status}</b>.</p>`,
  }).catch((err) => console.error("Failed to send leave status email:", err));

  res.json({ message: `Leave ${leave.status}.` });
});


app.get("/api/employee/:id/tasks", (req, res) => {
  const user = findUser(readDB(), req.params.id);
  if (!user) return res.status(404).json({ error: "Employee not found." });
  res.json(user.tasks || []);
});

app.post("/api/employee/:id/tasks", (req, res) => {
  const { title, description, priority, deadline, assignedBy } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: "Task title is required." });

  const db = readDB();
  const user = findUser(db, req.params.id);
  if (!user) return res.status(404).json({ error: "Employee not found." });

  if (!user.tasks) user.tasks = [];
  user.tasks.push({
    id: Date.now().toString(),
    title: title.trim(),
    description: description || "",
    priority: priority || "medium", // low | medium | high
    deadline: deadline || null,
    assignedDate: new Date().toISOString(),
    completedDate: null,
    status: "pending", // pending | in-progress | completed
    assignedBy: assignedBy === "admin" ? "admin" : "self",
  });
  writeDB(db);
  res.json(user.tasks);
});

app.patch("/api/employee/:id/tasks/:taskId", (req, res) => {
  const { status } = req.body;
  if (!["pending", "in-progress", "completed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  const db = readDB();
  const user = findUser(db, req.params.id);
  if (!user) return res.status(404).json({ error: "Employee not found." });

  const task = (user.tasks || []).find((t) => t.id === req.params.taskId);
  if (!task) return res.status(404).json({ error: "Task not found." });

  task.status = status;
  task.completedDate = status === "completed" ? new Date().toISOString() : null;
  writeDB(db);
  res.json(user.tasks);
});

app.delete("/api/employee/:id/tasks/:taskId", (req, res) => {
  const db = readDB();
  const user = findUser(db, req.params.id);
  if (!user) return res.status(404).json({ error: "Employee not found." });
  user.tasks = (user.tasks || []).filter((t) => t.id !== req.params.taskId);
  writeDB(db);
  res.json(user.tasks);
});


const ALLOWED_LEAVE_PER_MONTH = 2;
const LATE_THRESHOLD_MINUTES = 15;
const LATE_PENALTY = 100;

function weekdaysInMonth(year, monthIndex) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, monthIndex, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

function weekdaysElapsedInMonth(year, monthIndex) {
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === monthIndex;
  const lastDay = isCurrentMonth ? now.getDate() : new Date(year, monthIndex + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= lastDay; d++) {
    const day = new Date(year, monthIndex, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

function calculateSalary(user, monthStr) {
  const [year, month] = monthStr.split("-").map(Number);
  const workingDays = weekdaysInMonth(year, month - 1);
  const workingDaysElapsed = weekdaysElapsedInMonth(year, month - 1);

  const monthAttendance = (user.attendance || []).filter((a) => a.date.startsWith(monthStr));
  const presentDays =
    monthAttendance.filter((a) => a.status === "present").length +
    monthAttendance.filter((a) => a.status === "half-day").length * 0.5;
  const lateCount = monthAttendance.filter((a) => a.lateMinutes > LATE_THRESHOLD_MINUTES).length;

  const approvedLeaves = (user.leaves || []).filter((l) => l.status === "approved");
  let takenLeaveDays = 0;
  approvedLeaves.forEach((l) => {
    const d = new Date(l.startDate);
    const end = new Date(l.endDate);
    while (d <= end) {
      if (d.toISOString().slice(0, 7) === monthStr) takenLeaveDays++;
      d.setDate(d.getDate() + 1);
    }
  });

  const absentDays = Math.max(0, Math.round((workingDaysElapsed - presentDays - takenLeaveDays) * 10) / 10);

  const totalTasks = (user.tasks || []).length;
  const completedTasks = (user.tasks || []).filter((t) => t.status === "completed").length;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  let bonus = 0;
  if (completionPercent > 95) bonus = 2000;
  else if (completionPercent > 90) bonus = 1000;
  else if (completionPercent > 80) bonus = 500;

  const manualBonus = user.manualBonus || 0;
  const totalBonus = bonus + manualBonus;

  const basicSalary = user.basicSalary || 30000;
  const dailySalary = basicSalary / workingDays;

  const absentDeduction = Math.round(absentDays * dailySalary * 100) / 100;
  const latePenalty = lateCount * LATE_PENALTY;
  const extraLeave = Math.max(0, takenLeaveDays - ALLOWED_LEAVE_PER_MONTH);
  const leaveDeduction = Math.round(extraLeave * dailySalary * 100) / 100;

  const netSalary = Math.round((basicSalary + totalBonus - absentDeduction - latePenalty - leaveDeduction) * 100) / 100;

  return {
    month: monthStr,
    basicSalary,
    workingDays,
    presentDays,
    absentDays,
    lateCount,
    completedTasks,
    totalTasks,
    completionPercent,
    bonus,
    manualBonus,
    totalBonus,
    latePenalty,
    takenLeaveDays,
    leaveDeduction,
    absentDeduction,
    netSalary,
    generatedAt: new Date().toISOString(),
  };
}

app.patch("/api/admin/employees/:id/basic-salary", (req, res) => {
  const { basicSalary } = req.body;
  if (typeof basicSalary !== "number" || basicSalary <= 0) {
    return res.status(400).json({ error: "Enter a valid basic salary." });
  }
  const db = readDB();
  const user = findUser(db, req.params.id);
  if (!user) return res.status(404).json({ error: "Employee not found." });
  user.basicSalary = basicSalary;
  writeDB(db);
  res.json({ message: "Updated.", basicSalary });
});

app.patch("/api/admin/employees/:id/bonus", (req, res) => {
  const { bonus } = req.body;
  if (typeof bonus !== "number" || bonus < 0) {
    return res.status(400).json({ error: "Enter a valid bonus amount." });
  }
  const db = readDB();
  const user = findUser(db, req.params.id);
  if (!user) return res.status(404).json({ error: "Employee not found." });
  user.manualBonus = bonus;
  writeDB(db);
  res.json({ message: "Updated.", manualBonus: bonus });
});

app.post("/api/admin/employees/:id/salary/generate", (req, res) => {
  const db = readDB();
  const user = findUser(db, req.params.id);
  if (!user) return res.status(404).json({ error: "Employee not found." });

  const monthStr = req.body.month || todayStr().slice(0, 7);
  const slip = calculateSalary(user, monthStr);

  if (!user.salarySlips) user.salarySlips = [];
  user.salarySlips = user.salarySlips.filter((s) => s.month !== monthStr);
  user.salarySlips.push(slip);
  writeDB(db);

  res.json(slip);
});

app.get("/api/employee/:id/salary", (req, res) => {
  const user = findUser(readDB(), req.params.id);
  if (!user) return res.status(404).json({ error: "Employee not found." });
  res.json({ basicSalary: user.basicSalary || 30000, salarySlips: user.salarySlips || [] });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));