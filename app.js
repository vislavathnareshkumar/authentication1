const express = require("express");
const app = express();
const { open } = require("sqlite");

const sqlite = require("sqlite3");

const path = require("path");
const bcrypt = require("bcrypt");

app.use(express.json());

let db;

const dbpath = path.join(__dirname, "userData.db");

const intializationDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error :${e.message}`);
    process.exit(1);
  }
};

intializationDBAndServer();

// API 1
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUserDetails = `
    SELECT * FROM user
    WHERE
    username = '${username}'`;
  const getUserDetail = await db.get(getUserDetails);

  if (getUserDetail === undefined) {
    const passwordLenth = password.length;

    if (passwordLenth <= 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const postQuery = `
        INSERT INTO user(username, name, password, gender, location)
        VALUES
        (
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'


        ) `;
      await db.run(postQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

module.exports = app;

// API 2

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUserDetails = `
    SELECT * FROM user
    WHERE
    username = '${username}'`;

  const getUserDetail = await db.get(getUserDetails);
  if (getUserDetail === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      getUserDetail.password
    );

    if (isPasswordMatched) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const getUserDetails = `
    SELECT * FROM user
    WHERE
    username = '${username}'`;

  const getUserDetail = await db.get(getUserDetails);
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const isPasswordCorrect = await bcrypt.compare(
    oldPassword,
    getUserDetail.password
  );
  const passwordLenth = newPassword.length;

  if (isPasswordCorrect) {
    if (passwordLenth <= 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      updatePassword = `UPDATE user
        SET 
        password = '${hashedPassword}'
            WHERE 
            username = '${username}'`;

      await db.run(updatePassword);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
