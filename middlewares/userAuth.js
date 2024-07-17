// Middleware for checking if the user is logged in
const isLogin = async (req, res, next) => {
  try {
      if (req.session.userId) {
          next();
      } else {
          res.redirect('/login');
      }
  } catch (error) {
      console.log(error.message);
  }
}

//middleware for is login
const loginCheck =async(req,res,next)=>{
    try {
        if(req.session.userId){
            next()
        }else{
            res.redirect('/logout')
        }
        
    } catch (error) {
        console.log();
    }
}

// Middleware for checking if the user is logged out
const isLogout = async (req, res, next) => {
  try {
      if (req.session.userId) {
          res.redirect('/home');
      } else {
          next();
      }
  } catch (error) {
      console.log(error.message);
  }
}

// Middleware for checking if the order is confirmed
const isOrdered = async (req, res, next) => {
  try {
      if (req.session.orderConfirmed) {  
          next();
      } else {
          res.redirect('/home');
      }
  } catch (error) {
      console.log(error.message);
  }
}

module.exports = {
  isLogin,
  loginCheck,
  isLogout,
  isOrdered
}
