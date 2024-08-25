import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connect from "./db.js";
import cors from "cors";
import jwt from "jsonwebtoken";
import auth from "./auth.js";
import db from "./db.js";
import { ObjectId } from "mongodb";
import multer from "multer";
import path from "path";
import fs from 'fs';
import { fileURLToPath } from 'url';


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

// Register a new user
app.post("/users", async (req, res) => {
  try {
    const userData = req.body;
    const result = await auth.registerUser(userData);
    res.status(201).json({ message: "User registered successfully", userId: result.insertedId });
  } catch (e) {
    console.error("Error registering user:", e);
    res.status(500).json({ error: e.message });
  }
});


// Authentication
app.post("/auth", async (req, res) => {
  const { email, password } = req.body;
  try {
      const user = await auth.authenticateUser(email, password);
      console.log("Backend response:", user); // Log backend response
      res.json(user);
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
      .collection("users")
      .find({
        ProfileType: "Student", // Match exactly "Student"
        $or: [
          { FirstName: new RegExp(searchByName, "i") },
          { LastName: new RegExp(searchByName, "i") }
        ]
      })
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
      .collection("users")
      .find({
        ProfileType: "Teacher", // Match exactly "Teacher"
        $or: [
          { FirstName: new RegExp(searchByName, "i") },
          { LastName: new RegExp(searchByName, "i") }
        ]
      })
      .toArray();
    res.json(teachers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Student feed
app.get("/student-feed", async (req, res) => {
  let db = await connect();
  try {
    // Fetch all posts from the student-posts collection, sorted by creation date (newest first)
    const studentPosts = await db
      .collection("student-posts")
      .find({})
      .sort({ posted_at: -1 }) // Sort by createdAt field in descending order
      .toArray();

    res.json({ feed: studentPosts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Teacher feed
app.get("/teacher-feed", async (req, res) => {
  let db = await connect();
  try {
    // Fetch all posts from the teacher-posts collection, sorted by creation date (newest first)
    const teacherPosts = await db
      .collection("teacher-posts")
      .find({})
      .sort({ posted_at: -1 }) // Sort by createdAt field in descending order
      .toArray();

    res.json({ feed: teacherPosts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fetch a specific student post by its ID
app.get("/student-feed/:id", async (req, res) => {
  let db = await connect();
  const postId = req.params.id;

  try {
    // Fetch the post with the specific postId
    const post = await db.collection("student-posts").findOne({ _id: new ObjectId(postId) });

    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ error: "Post not found" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fetch a specific teacher post by its ID
app.get("/teacher-feed/:id", async (req, res) => {
  let db = await connect();
  const postId = req.params.id;

  try {
    // Fetch the post with the specific postId
    const post = await db.collection("teacher-posts").findOne({ _id: new ObjectId(postId) });

    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ error: "Post not found" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fetch a user by their id
app.get("/users/:id", async (req, res) => {
  let db = await connect();
  const userId = req.params.id;

  try {
    // Convert the ID from a string to an ObjectId
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (e) {
    res.status(500).json({ error: "An error occurred while fetching the user: " + e.message });
  }
});

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads/posts/');
    
    // Ensure the directory exists
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Save with a unique name
  }
});

const upload = multer({ storage: storage });

// Route to create a new post
app.post('/posts', upload.single('image'), async (req, res) => {
  let db = await connect();

  try {
      const { title, text, email, userRole } = req.body;
      if (!title || !text || !email || !userRole) {
          throw new Error('Missing required fields');
      }

      const postDoc = {
          url: req.file ? `/uploads/posts/${req.file.filename}` : null,
          title: title,
          text: text,
          posted_at: new Date(),
          email: email,
          userRole: userRole,
          likes: 0, // Initialize likes count
          likedBy: [], // Initialize likedBy as an empty array
          reports: 0,       // Initialize reports count
          reportedBy: [],    // Initialize reportedBy as an empty array
      };

      if (userRole === "Student") {
          const studentPostsRef = db.collection("student-posts");
          await studentPostsRef.insertOne(postDoc);
          res.status(201).json({ message: 'Post saved to student-posts collection', post: postDoc });
      } else if (userRole === "Teacher") {
          const teacherPostsRef = db.collection("teacher-posts");
          await teacherPostsRef.insertOne(postDoc);
          res.status(201).json({ message: 'Post saved to teacher-posts collection', post: postDoc });
      } else {
          res.status(400).json({ error: 'Invalid user role' });
      }
  } catch (error) {
      console.error('Error saving post:', error.message);
      res.status(400).json({ error: 'Error saving post: ' + error.message });
  }
});

// Serve static files from the "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Delete a student post by ID
app.delete("/student-posts/:id", async (req, res) => {
  let db = await connect();
  const postId = req.params.id;

  // Check if postId is valid
  if (!ObjectId.isValid(postId)) {
    return res.status(400).json({ error: 'Invalid post ID' });
  }

  try {
    // Convert postId to ObjectId if it's not already one
    const result = await db.collection("student-posts").deleteOne({ _id: new ObjectId(postId) });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: 'Post deleted successfully' });
    } else {
      res.status(404).json({ error: 'Post not found' });
    }
  } catch (e) {
    console.error("Error deleting post:", e);
    res.status(500).json({ error: 'An error occurred while deleting the post' });
  }
});

// Delete a teacher post by ID
app.delete("/teacher-posts/:id", async (req, res) => {
  let db = await connect();
  const postId = req.params.id;

  // Check if postId is valid
  if (!ObjectId.isValid(postId)) {
    return res.status(400).json({ error: 'Invalid post ID' });
  }

  try {
    // Convert postId to ObjectId if it's not already one
    const result = await db.collection("teacher-posts").deleteOne({ _id: new ObjectId(postId) });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: 'Post deleted successfully' });
    } else {
      res.status(404).json({ error: 'Post not found' });
    }
  } catch (e) {
    console.error("Error deleting post:", e);
    res.status(500).json({ error: 'An error occurred while deleting the post' });
  }
});
// Route to handle student post likes
app.post("/student-posts/:postId/like", async (req, res) => {
  const { postId } = req.params;
  const { userEmail } = req.body; // The email of the user liking the post
  let db = await connect();

  try {
    const postRef = db.collection("student-posts");

    // Check if the post exists
    const post = await postRef.findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Ensure likedBy is an array to avoid null reference
    post.likedBy = post.likedBy || [];

    if (post.likedBy.includes(userEmail)) {
      return res.status(400).json({ message: 'User has already liked this post' });
    }

    // Update the post: increment likes and add userEmail to likedBy array
    await postRef.updateOne(
      { _id: new ObjectId(postId) },
      {
        $inc: { likes: 1 },
        $push: { likedBy: userEmail }
      }
    );

    res.status(200).json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Error liking post:', error.message);
    res.status(500).json({ error: 'Error liking post: ' + error.message });
  }
});

// Route to handle teacher post likes
app.post("/teacher-posts/:postId/like", async (req, res) => {
  const { postId } = req.params;
  const { userEmail } = req.body; // The email of the user liking the post
  let db = await connect();

  try {
    const postRef = db.collection("teacher-posts");

    // Check if the post exists
    const post = await postRef.findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Ensure likedBy is an array to avoid null reference
    post.likedBy = post.likedBy || [];

    if (post.likedBy.includes(userEmail)) {
      return res.status(400).json({ message: 'User has already liked this post' });
    }

    // Update the post: increment likes and add userEmail to likedBy array
    await postRef.updateOne(
      { _id: new ObjectId(postId) },
      {
        $inc: { likes: 1 },
        $push: { likedBy: userEmail }
      }
    );

    res.status(200).json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Error liking post:', error.message);
    res.status(500).json({ error: 'Error liking post: ' + error.message });
  }
});

// Route to handle student post reports
app.post("/student-posts/:postId/report", async (req, res) => {
  const { postId } = req.params;
  const { userEmail } = req.body; // The email of the user reporting the post
  let db = await connect();

  try {
      const postRef = db.collection("student-posts");
      
      // Check if the user has already reported the post
      const post = await postRef.findOne({ _id: new ObjectId(postId) });

      if (!post) {
          return res.status(404).json({ message: 'Post not found' });
      }

      if (post.reportedBy.includes(userEmail)) {
          return res.status(400).json({ message: 'You have already reported this post.' });
      }

      // Update the post: increment reports and add userEmail to reportedBy array
      await postRef.updateOne(
          { _id: new ObjectId(postId) },
          {
              $inc: { reports: 1 },
              $push: { reportedBy: userEmail }
          }
      );

      res.status(200).json({ message: 'Post reported successfully' });
  } catch (error) {
      console.error('Error reporting post:', error.message);
      res.status(500).json({ error: 'Error reporting post: ' + error.message });
  }
});

// Route to handle teacher post reports
app.post("/teacher-posts/:postId/report", async (req, res) => {
  const { postId } = req.params;
  const { userEmail } = req.body; // The email of the user reporting the post
  let db = await connect();

  try {
      const postRef = db.collection("teacher-posts");

      // Check if the user has already reported the post
      const post = await postRef.findOne({ _id: new ObjectId(postId) });

      if (!post) {
          return res.status(404).json({ message: 'Post not found' });
      }

      if (post.reportedBy.includes(userEmail)) {
          return res.status(400).json({ message: 'You have already reported this post.' });
      }

      // Update the post: increment reports and add userEmail to reportedBy array
      await postRef.updateOne(
          { _id: new ObjectId(postId) },
          {
              $inc: { reports: 1 },
              $push: { reportedBy: userEmail }
          }
      );

      res.status(200).json({ message: 'Post reported successfully' });
  } catch (error) {
      console.error('Error reporting post:', error.message);
      res.status(500).json({ error: 'Error reporting post: ' + error.message });
  }
});


// Route to fetch all posts by a specific user
app.get("/posts/user/:email", async (req, res) => {
  let db = await connect();
  const userEmail = req.params.email;

  try {
      // Fetch all posts from both "student-posts" and "teacher-posts" collections where email matches
      const studentPosts = await db.collection("student-posts").find({ email: userEmail }).toArray();
      const teacherPosts = await db.collection("teacher-posts").find({ email: userEmail }).toArray();

      // Combine both arrays into one
      const allPosts = studentPosts.concat(teacherPosts);

      // Return all posts made by the user
      res.status(200).json(allPosts);
  } catch (e) {
      console.error("Error fetching posts by user:", e);
      res.status(500).json({ error: "Failed to fetch posts by user: " + e.message });
  }
});

// Fetch all comments
app.get("/comments", async (req, res) => {
  let db = await connect();
  try {
    // Fetch all posts from the comments collection, sorted by creation date (newest first)
    const comments = await db
      .collection("comments")
      .find({})
      .sort({ posted_at: -1 }) // Sort by createdAt field in descending order
      .toArray();

    res.json({ feed: comments });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fetch comments for a specific post
app.get("/comments/:postId", async (req, res) => {
  let db = await connect();
  const postId = req.params.postId;

  try {
    // Fetch comments that match the specific postId, sorted by creation date (newest first)
    const comments = await db
      .collection("comments")
      .find({ postId: new ObjectId(postId) })
      .sort({ posted_at: -1 }) // Sort by posted_at field in descending order
      .toArray();

    res.json({ comments });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Route to post a new comment
app.post("/comments", async (req, res) => {
  let db = await connect();
  const { text, email, postId } = req.body;

  // Validate required fields
  if (!text || !email || !postId) {
      return res.status(400).json({ error: "All fields (text, email, postId) are required." });
  }

  try {
      // Ensure postId is a valid ObjectId using createFromHexString
      const commentDoc = {
          text: text,
          email: email,
          postId: new ObjectId(postId), // Use ObjectId for the postId
          posted_at: new Date() // Store the current date as the time the comment was posted
      };

      const result = await db.collection("comments").insertOne(commentDoc);
      res.status(201).json({ message: 'Comment posted successfully', commentId: result.insertedId });
  } catch (error) {
      console.error("Error posting comment:", error);
      res.status(500).json({ error: 'Error posting comment: ' + error.message });
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
