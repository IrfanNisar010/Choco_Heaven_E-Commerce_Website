const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: (req,file,callBack)=>{
        callBack(null,'./public/assets/img/brands')
    },
    filename:(req,file,callBack)=>{
        const ext = path.extname(file.originalname)
        const fileName = file.originalname.replace(ext, '')
        callBack(null, `${fileName}-${Date.now()}${ext}`)
    }
})

const upload =multer({storage:storage,limits:{'files':4}})
// const Upload = multer({
//     storage: storage,
//     limits: { fileSize: 1024 * 1024 * 5 } 
// }).fields([
//     { name: 'productImage1', maxCount: 1 },
//     { name: 'productImage2', maxCount: 1 },
//     { name: 'productImage3', maxCount: 1 },
//     { name: 'productImage4', maxCount: 1 }
// ]);

module.exports={
    upload
}