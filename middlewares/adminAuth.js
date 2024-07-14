const isLogin = async(req,res,next)=>{
    try {
        if(req.session.admin){
            
        }else{
            return res.redirect('/admin/adminLogin')
        }
        next()
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async(req,res,next)=>{
    try {
        if(req.session.admin){
            return res.redirect('/admin/dashboard')
        }
        next()
    } catch (error) {
        console.log(error.message);
    }
}

module.exports ={
    isLogin ,
    isLogout
}