// controller.js

const express = require("express");
const path = require("path");
const connection = require("./database").pool;
const bcrypt = require("bcrypt");

const router = express.Router();

router.get("/", function (request, response) {
  // Render login template
  response.sendFile(path.join(__dirname + "/login.html"));
});

router.post("/login", function (req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Please provide username and password",
    });
  }

  connection.getConnection((err, connection) => {
    if (err) {
      console.error(err.message);
      return res
        .status(500)
        .json({ error: "Internal server error" });
    }

    connection.query(
      "SELECT * FROM accounts WHERE username = ? AND password = ?",
      [username, password],
      function (error, results, fields) {
        if (error) {
          console.error(error.message);
          return res
            .status(500)
            .json({ error: "Internal server error" });
        }

        if (results.length > 0) {
          req.session.loggedin = true;
          req.session.username = username;
          return res.status(200).json({
            message: "Login successful",
            username: username,
          });
        } else {
          return res.status(401).json({
            error: "Incorrect username or password",
          });
        }
      }
    );
  });
});

// Xử lý yêu cầu trang chủ

router.get("/home", function (request, response) {
  if (request.session.loggedin) {
    response.redirect("http://localhost:5173");
  } else {
    response.send("Please login to view this page!");
  }
  response.end();
});

router.get("/products", function (request, response) {
  connection.query(
    "SELECT * FROM products",
    function (err, results, field) {
      if (err) {
        console.error(err.message);
        return res
          .status(500)
          .json({ error: "Internal server error" });
      }

      // Response data
      return response.status(200).json(results);
    }
  );
});

module.exports = router;
