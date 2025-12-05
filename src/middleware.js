const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const token = req.headers.token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded.id || !decoded.email || !decoded.role) {
      return res.status(401).json({
        msg: "Unauthorized, token missing or invalid",
      });
    }
    req.id = decoded.id;
    req.name = decoded.name;
    req.role = decoded.role;
    req.email = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function adminMiddleware(req, res, next) {
  const token = req.headers.token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded.id || !decoded.email || !decoded.role) {
      return res.status(401).json({
        msg: "invalid token!",
      });
    }
    if(decoded.role !== "admin"){
      return res.status(401).json({ error: "Unauthorized", msg:"you are not a admin" });
    }
    req.id = decoded.id;
    req.name = decoded.name;
    req.role = decoded.role;
    req.email = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { authMiddleware, adminMiddleware };
