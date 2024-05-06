// controller.js
const express = require("express");
const path = require("path");
const connection = require("./database").pool;
const bcrypt = require("bcrypt");
const { Tenant, User } = require("./models");
const { v4: uuidv4 } = require("uuid"); // Import uuidv4
const { error } = require("console");
const { create } = require("domain");
const { Product } = require("./models");
const { Invoice } = require("./models");
const jwt = require("jsonwebtoken");
const { where } = require("sequelize");

const router = express.Router();

router.get("/", function (request, response) {
  // Render login template
  response.sendFile(path.join(__dirname + "/login.html"));
});

// register
router.post("/register", async (request, response) => {
  const { username, password, email, domain } =
    request.body;

  if (!username || !password || !email || !domain) {
    return response.status(400).json({
      error:
        "Please provide username, password, email, and domain",
    });
  }

  try {
    let tenant;

    // Check existing domain
    const existingTenant = await Tenant.findOne({
      where: { domain },
    });

    if (existingTenant) {
      tenant = existingTenant;
    } else {
      const tenantId = uuidv4();
      const tenantName = uuidv4();
      tenant = await Tenant.create({
        id: tenantId,
        name: tenantName,
        domain,
      });
    }

    // Hashed password
    const hashedPassword = await bcrypt.hash(password, 10);

    //
    const newUser = await User.create({
      id: uuidv4(),
      username: username,
      password: hashedPassword,
      email: email,
      TenantId: tenant.id,
    });

    return response.status(201).json({
      message: "User registered successfully",
      tenantId: tenant.id,
      newUser: newUser,
    });
  } catch (error) {
    console.error(error.message);
    return response
      .status(500)
      .json({ error: "Internal server error" });
  }
});

// Route to create a new product for a specific tenant
router.post(
  "/tenants/:tenantId/products",
  async (request, response) => {
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
        tenantId: tenantId,
      });
      console.log(newProduct);

      return response.status(200).json({
        message: "Product was created successfully",
        product: newProduct,
      });
    } catch (error) {
      console.error("Error creating product", error);
      return response
        .status(500)
        .json({ error: "Internal server error" });
    }
  }
);

// Login
router.post("/login", async (request, response) => {
  const { username, password } = request.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Please provide username and password",
    });
  }

  try {
    const user = await User.findOne({
      where: { username },
    });
    console.log(user);

    const isPasswordValid =
      user === null
        ? false
        : bcrypt.compare(password, user.password);

    if (!(user && isPasswordValid)) {
      return response
        .status(401)
        .json({ error: "Invalid username or password" });
    }

    // Trích xuất tenantId từ user hoặc từ cơ sở dữ liệu nếu cần
    const tenantId = user.TenantId;
    console.log(tenantId);

    const userForToken = {
      username: user.username,
      id: user.id,
      tenantId: tenantId,
    };

    const token = jwt.sign(userForToken, "my_secret", {
      expiresIn: 60 * 60,
    });

    return response.status(200).json({
      name: username,
      token: token,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    response
      .status(500)
      .json({ error: "Internal server error" });
  }
});

router.get("/products", async (request, response) => {
  const token = getTokenFrom(request);
  if (!token) {
    return response
      .status(401)
      .json({ error: "Unauthorized" });
  }

  try {
    const decodedToken = jwt.verify(token, "my_secret");

    const tenantId = decodedToken.tenantId;

    const products = await Product.findAll({
      where: { tenantId: tenantId },
    });

    return response.status(200).json(products);
  } catch (error) {
    console.error("Error retreaving products:", error);
    return response
      .status(500)
      .json({ error: "Internal server error" });
  }
});

// post order
router.post("/orders", async (request, response) => {
  const token = getTokenFrom(request);
  if (!token) {
    return response
      .status(401)
      .json({ error: "Unauthorized" });
  }

  try {
    const decodedToken = jwt.verify(token, "my_secret");

    const tenantId = decodedToken.tenantId;
    const username = decodedToken.username;
    const userId = decodedToken.id;


    const { productName, amount, quantity } =
      request.body;

    const newInvoice = await Invoice.create({
      amount: amount,
      status: "ordered",
      productName: productName,
      quantity: quantity,
      tenantId: tenantId,
      username: username,
      userId: userId,
    });

    response.status(201).json({
      invoice: newInvoice,
      message: "Create invoice successfully",
    });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (
    authorization &&
    authorization.startsWith("Bearer ")
  ) {
    return authorization.replace("Bearer ", "");
  }
  return null;
};

module.exports = router;
