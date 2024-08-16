import mongo from "mongodb";
import connect from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Ensure that the "users" collection has a unique index on the "email" field
let authentication = async () => {
  let db = await connect();
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
};
authentication();

export default {
  // Register a new user
  async registerUser(userData) {
    let db = await connect();
    let doc = {
      Email: userData.email,
      Password: await bcrypt.hash(userData.password, 8),
      FirstName: userData.firstName,
      LastName: userData.lastName,
      ProfileType: userData.profileType, // "Student" or "Teacher"
    };

    try {
      let result = await db.collection("users").insertOne(doc);
      if (result && result.insertedId) {
        return result;
      }
    } catch (e) {
      if (e.name === "MongoError" && e.code === 11000) {
        throw new Error("User already exists!");
      } else {
        throw new Error("Failed to register user: " + e.message);
      }
    }
  },

  // Authenticate a user
  async authenticateUser(email, password) {
    let db = await connect();
    let user = await db.collection("users").findOne({ Email: email });

    if (user && user.Password && (await bcrypt.compare(password, user.Password))) {
      delete user.Password;
      let token = jwt.sign(user, process.env.JWT_SECRET, {
        algorithm: "HS512",
        expiresIn: "1 week",
      });
      return {
        token,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
        profileType: user.ProfileType,
      };
    } else {
      throw new Error("Cannot authenticate");
    }
  },

  // Verify the JWT
  verify(req, res, next) {
    try {
      let authorization = req.headers.authorization.split(" ");
      let type = authorization[0];
      let token = authorization[1];

      if (type !== "Bearer") {
        return res.status(401).send();
      } else {
        req.jwt = jwt.verify(token, process.env.JWT_SECRET);
        return next();
      }
    } catch (e) {
      return res.status(403).send();
    }
  },
};
