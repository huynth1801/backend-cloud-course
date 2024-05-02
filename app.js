// app.js

const express = require("express");
const session = require("express-session");
const path = require("path");
const controller = require("./controller");
const cors = require("cors");

const app = express();

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "static")));
app.use("/", controller);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
