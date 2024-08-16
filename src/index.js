import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connect from "./db.js";
import cors from "cors";
import jwt from "jsonwebtoken";
import auth from "./auth.js";
import db from "./db.js";

var app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,HEAD,OPTIONS,POST,PUT,DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content Type, Accept, Authorization"
  );
  next();
});

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

// ping db to test connection
app.get("/ping-db", async (req, res) => {
  try {
    console.log("pinging db");

    let db = await connect(); // Connect to the database
    console.log("connected to db, now pinging...");
    await db.command({ ping: 1 }); // Ping the database
    console.log("ping successful");
    res.status(200).json({ message: "Successfully connected to the database." });
  } catch (e) {
    console.error("Error during db connection/ping:", e);
    res.status(500).json({ error: "Failed to connect to the database: " + e.message });
  }
});



// Authentication
app.post("/auth", async (req, res) => {
  const { username, password } = req.body;
  try {
    const token = await auth.authenticateUser(username, password);
    res.json({ token });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

// Fetch all users
app.get("/users", async (req, res) => {
  let db = await connect();
  try {
    const users = await db.collection("users").find({}).toArray();
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fetch all students, optionally filtered by name
app.get("/students", async (req, res) => {
  let db = await connect();
  const searchByName = req.query.name || "";
  try {
    const students = await db
      .collection("students")
      .find({ name: new RegExp(searchByName, "i") })
      .toArray();
    res.json(students);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fetch all teachers, optionally filtered by name
app.get("/teachers", async (req, res) => {
  let db = await connect();
  const searchByName = req.query.name || "";
  try {
    const teachers = await db
      .collection("teachers")
      .find({ name: new RegExp(searchByName, "i") })
      .toArray();
    res.json(teachers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Student feed
app.get("/student-feed", (req, res) => {
  // Logic to fetch student feed
  res.json({ feed: [] });
});

// Teacher feed
app.get("/teacher-feed", (req, res) => {
  // Logic to fetch teacher feed
  res.json({ feed: [] });
});

// Fetch individual student by JMBAG
app.get("/students/:jmbag", async (req, res) => {
  let db = await connect();
  const jmbag = req.params.jmbag;
  try {
    const student = await db.collection("students").findOne({ jmbag: jmbag });
    if (student) {
      res.json(student);
    } else {
      res.status(404).json({ message: "Student not found" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create a new student
app.post("/students", async (req, res) => {
  let db = await connect();
  const newStudent = req.body; // Make sure to validate this data!
  try {
    await db.collection("students").insertOne(newStudent);
    res.status(201).json({ message: "Student created" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fetch user profile by ID
app.get("/profile/:userId", async (req, res) => {
  let db = await connect();
  const userId = req.params.userId;
  try {
    const userProfile = await db.collection("users").findOne({ userId: userId });
    res.json(userProfile);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Follow a user
app.post("/follow/:userId", async (req, res) => {
  let db = await connect();
  const userId = req.params.userId;
  const followerId = req.body.followerId;
  try {
    await db.collection("follows").insertOne({ userId, followerId });
    res.status(200).json({ message: "Following successful" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create a new post
app.post("/posts", async (req, res) => {
  let db = await connect();
  const { userId, content } = req.body;
  const newPost = { userId, content, createdAt: new Date() };
  try {
    await db.collection("posts").insertOne(newPost);
    res.status(201).json({ message: "Post created" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Report inappropriate post
app.post("/report-post/:postId", async (req, res) => {
  let db = await connect();
  const postId = req.params.postId;
  const reason = req.body.reason;
  try {
    await db.collection("reports").insertOne({ postId, reason, reportedAt: new Date() });
    res.status(200).json({ message: "Post reported" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || port, () => {
  console.log(`Example app listening on port ${port}`);
});
