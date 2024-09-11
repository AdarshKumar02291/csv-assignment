const express =require("express")
const uploadRouter = require("./upload")
const router = express.Router();

router.use("/upload",uploadRouter)


module.exports = router;