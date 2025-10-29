 const isAuthenticated =(req, res, next)=> {
  if (req.session.user) next();
  else {
    return res.status(401).json({ message: 'Not logged in' });
  }
}

 const isAdmin=(req, res, next) =>{
  if (req.session.user && req.session.user.role === "admin") next();
  else res.redirect("/");
}

module.exports = {
  isAuthenticated,
  isAdmin
}
