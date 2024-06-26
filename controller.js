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
const middlewareController = require("./utils/middleware");

const router = express.Router();

let refreshTokens = [];

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

    const userForToken = {
      username: user.username,
      id: user.id,
      tenantId: tenantId,
    };

    const accessToken = generateAccessToken(userForToken);
    const refreshToken = generateRefreshToken(userForToken);
    refreshTokens.push(refreshToken);

    response.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      path: "/",
      sameSite: "strict",
    });

    return response.status(200).json({
      name: username,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    response
      .status(500)
      .json({ error: "Internal server error" });
  }
});

router.post("/refresh", async (request, response) => {
  const refreshToken = request.cookies?.refreshToken;

  if (!refreshToken) {
    return response
      .status(401)
      .json("You're not authenticated");
  }

  if (!refreshTokens.includes(refreshToken)) {
    return response
      .status(403)
      .json("Refresh token is not a valid");
  }

  refreshTokens = refreshTokens.filter(
    (token) => token !== refreshToken
  );

  jwt.verify(
    refreshToken,
    "my_refresh_secret",
    (error, user) => {
      if (error) {
        if (error.name === "TokenExpiredError") {
          // If refresh token is expired, return unauthorized
          return response
            .status(401)
            .json("Refresh token expired");
        } else {
          // If refresh token is invalid for any other reason, return error
          console.error(error);
          return response
            .status(500)
            .json("Internal server error");
        }
      }

      const userData = {
        username: user.username,
        id: user.id,
        tenantId: user.tenantId,
      };

      const newAccessToken = generateAccessToken(userData);

      const newRefreshToken =
        generateRefreshToken(userData);

      refreshTokens.push(newRefreshToken);
      response.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "strict",
      });

      // Return the new access token
      response
        .status(200)
        .json({ accessToken: newAccessToken });
    }
  );
});

// log out
router.post(
  "/logout",
  middlewareController.verifyToken,
  async (request, response) => {
    response.clearCookie("refreshToken");
    refreshTokens = refreshTokens.filter(
      (token) => token !== request.cookies?.refreshToken
    );
    response.status(200).json("Logged out successfully");
  }
);

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

    const { productName, amount, quantity } = request.body;

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

// get orders by userid
router.get(
  "/orders/:tenantId/:userId",
  async (request, response) => {
    const accessToken = getTokenFrom(request);
    if (!accessToken) {
      return response
        .status(401)
        .json({ error: "Unauthorized" });
    }

    try {
      const decodedToken = jwt.verify(
        accessToken,
        "my_secret"
      );

      const tenantId = decodedToken.tenantId;
      const userId = decodedToken.id;
      // Tìm tất cả các đơn hàng có userId và tenantId tương ứng
      const orders = await Invoice.findAll({
        where: { userId: userId, tenantId: tenantId },
      });

      // Trả về các đơn hàng đã tìm thấy
      response.status(200).json({
        orders: orders,
        message: "Get orders successfully",
      });
    } catch (error) {
      response.status(500).json({ error: error.message });
    }
  }
);

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

const generateAccessToken = (data) => {
  const access_token = jwt.sign(data, "my_secret", {
    expiresIn: "1h",
  });
  return access_token;
};

const generateRefreshToken = (data) => {
  const refresh_token = jwt.sign(
    data,
    "my_refresh_secret",
    { expiresIn: "7d" }
  );
  return refresh_token;
};

module.exports = router;
