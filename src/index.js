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

app.get("/", (req, res) =>{
    res.json({"status": "ok"})
})

// Autentikacija
app.get("/auth", (req, res) => {
    // Logika za generiranje tokena za autentikaciju
    res.json({ "token": "generated_token_here" });
});

// Ruta za dohvat svih korisnika
app.get("/users", (req, res) => {
    // Logika za dohvat svih korisnika iz baze
    res.json({ "users": [] }); // Vraćanje korisnika iz baze kao odgovor
});

// Ruta za dohvat svih studenata
app.get("/students", (req, res) => {
    // Logika za dohvat studenata iz baze, možda filtrirano po imenu
    const searchByName = req.query.name;
    console.log(searchByName);
    // Vraćanje studenata iz baze kao odgovor
    res.json({ "students": [] });
});

// Ruta za dohvat svih učitelja
app.get("/teachers", (req, res) => {
    // Logika za dohvat učitelja iz baze, možda filtrirano po imenu
    const searchByName = req.query.name;
    console.log(searchByName);
    // Vraćanje učitelja iz baze kao odgovor
    res.json({ "teachers": [] });
});

// Ruta za feed studenata
app.get("/student-feed", (req, res) => {
    // Logika za dohvat feeda za studente
    res.json({ "feed": [] }); // Vraćanje postova/feeda za studente
});

// Ruta za feed učitelja
app.get("/teacher-feed", (req, res) => {
    // Logika za dohvat feeda za učitelje
    res.json({ "feed": [] }); // Vraćanje postova/feeda za učitelje
});

// Ruta za dohvat pojedinačnog studenta po JMBAG-u
app.get("/students/:jmbag", (req, res) => {
    const jmbag = req.params.jmbag;
    // Logika za dohvat pojedinog studenta prema JMBAG-u iz baze
    res.json({ "student": { "jmbag": jmbag } });
});

// Ruta za stvaranje novog studenta
app.post("/students", (req, res) => {
    // Logika za stvaranje novog studenta u bazi prema poslanim podacima
    res.status(201).send();
});

// Ruta za dohvat profila korisnika
app.get("/profile/:userId", (req, res) => {
    const userId = req.params.userId;
    // Logika za dohvat profila korisnika prema ID-u iz baze
    res.json({ "userProfile": { "userId": userId } });
});
  
  // Ruta za praćenje (follow) korisnika
  app.post("/follow/:userId", (req, res) => {
    const userId = req.params.userId;
    // Logika za praćenje korisnika (follow) u sustavu
    res.status(200).json({ "message": `You started following user with ID ${userId}` });
});
  
  // Ruta za objavu novog sadržaja od strane korisnika
  app.post("/posts", (req, res) => {
    const { userId, content } = req.body;
    // Logika za stvaranje nove objave u bazi od strane korisnika
    res.status(201).json({ "message": `Post created by user ${userId}` });
});
  
  // Ruta za prijavu neprikladnog sadržaja
  app.post("/report-post/:postId", (req, res) => {
    const postId = req.params.postId;
    // Logika za prijavu objave kao neprikladne
    res.status(200).json({ "message": `Post ${postId} reported as inappropriate` });
});
  
app.listen(process.env.PORT || port, () => {
    console.log(`Example app listening on port ${port}`);
  });