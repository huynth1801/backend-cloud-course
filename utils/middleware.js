const jwt = require("jsonwebtoken");

const middlewareController = {
  verifyToken: (request, response, next) => {
    const token = request.headers.token;
    if (token) {
      const accessToken = token.split(" ")[1];
      jwt.verify(accessToken, "my_secret", (err, user) => {
        if (err) {
          return response
            .status(403)
            .json("Token is not valid");
        }
        request.user = user;
        next();
      });
    } else {
      return response
        .status(401)
        .json("You're not authenticated");
    }
  },
};

module.exports = middlewareController;
