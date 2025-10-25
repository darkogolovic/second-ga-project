 const isAuthenticated =(req, res, next)=> {
  if (req.session.user) next();
  else res.redirect("/login");
}

 const isAdmin=(req, res, next) =>{
  if (req.session.user && req.session.user.role === "admin") next();
  else res.redirect("/");
}

module.exports = {
  isAuthenticated,
  isAdmin
}
