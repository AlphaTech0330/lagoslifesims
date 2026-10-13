/**
 * Express middleware to restrict access exclusively to administrative accounts
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: Administrative privileges required'
  });
};

module.exports = { adminOnly };