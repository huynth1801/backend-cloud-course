// controller.js
const express = require("express");
const path = require("path");
const connection = require("./database").pool;
const bcrypt = require("bcrypt");
const {Tenant, User} = require('./models');
const { v4: uuidv4 } = require('uuid'); // Import uuidv4
const { error } = require("console");
const { create } = require("domain");
const {Product} = require('./models')
const jwt = require('jsonwebtoken');
const { where } = require("sequelize");

const router = express.Router();

router.get("/", function (request, response) {
  // Render login template
  response.sendFile(path.join(__dirname + "/login.html"));
});

// register
router.post('/register', async (request, response) => {
  const { username, password, email } = request.body;

  // Kiểm tra xem có username và password được cung cấp không
  if (!username || !password || !email) {
    return response.status(400).json({
      error: "Please provide username, password, and email",
    });
  }

  try {
    // Tạo một UUID cho tenantId
    const tenantId = uuidv4();

    // Tạo một tên tenant duy nhất bằng cách sử dụng UUID
    const tenantName = uuidv4();

    // generate a new tenant
    const tenant = await Tenant.create({ id: tenantId, name: tenantName });

    // Hashed password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo một user mới với thông tin được cung cấp và tenantId
    const newUser = await User.create({
      username: username,
      password: hashedPassword,
      email: email,
      TenantId: tenant.id
    });

    return response.status(201).json({
      message: "User registered successfully",
      tenantId: tenantId,
    });
  } catch (error) {
    console.error(error.message);
    return response.status(500).json({ error: "Internal server error" });
  }
});

// Route to create a new product for a specific tenant
router.post('/tenants/:tenantId/products', async (request, response) => {
  try {
    // Get info from request body
    const { name, price, description } = request.body;
    const { tenantId } = request.params;
    console.log(tenantId);

    // Generate new product
    const newProduct = await Product.create({
      name: name,
      price: price,
      description: description,
      tenantId: tenantId 
    });
    console.log(newProduct);

    return response.status(200).json({
      message: "Product was created successfully",
      product: newProduct
    });
  } catch (error) {
    console.error("Error creating product", error);
    return response.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", async (request, response) => {
  const { username, password } = request.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Please provide username and password",
    });
  }

  try {
    const user = await User.findOne({where: {username}});
    console.log(user);

    const isPasswordValid = user === null ? false : bcrypt.compare(password, user.password);

    if(!(user && isPasswordValid)) {
      return response.status(401).json({error: 'Invalid username or password'})
    }

    const userForToken = {
      username: user.username,
      id: user.id
    }

    const token = jwt.sign(
      userForToken,
      'my_secret',
      { expiresIn: 60*60}
    )

    return response.status(200).json({ token})
  }
  catch (error) {
    console.error('Error logging in:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
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
