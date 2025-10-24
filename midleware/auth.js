export function isAuthenticated(req, res, next) {
  if (req.session.user) next();
  else res.redirect("/login");
}

export function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === "admin") next();
  else res.redirect("/");
}
