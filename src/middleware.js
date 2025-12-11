const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized, token missing or invalid",
    });
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || !decoded.id || !decoded.email || !decoded.role) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized, token missing or invalid",
      });
    }

    req.id = decoded.id;
    req.name = decoded.name;
    req.email = decoded.email;
    req.role = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized, token missing or invalid",
    });
  }
}

function adminMiddleware(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized, token missing or invalid",
    });
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || !decoded.id || !decoded.email || !decoded.role) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized, token missing or invalid",
      });
    }

    if (decoded.role !== "admin") {
      return res.status(401).json({
        success: false,
        error: "Unauthorized, admin access required",
      });
    }

    req.id = decoded.id;
    req.name = decoded.name;
    req.email = decoded.email;
    req.role = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized, token missing or invalid",
    });
  }
}

module.exports = { authMiddleware, adminMiddleware };
