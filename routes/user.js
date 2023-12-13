//importing package
const express = require('express');


//importing modules
const userControler = require('../controllers/user')
const passwordController = require('../controllers/password')
const mainPageController = require('../controllers/mainPage')
const signController = require('../controllers/signup&signin')
const authController = require('../middleware/authentication')
const multerMiddleware = require('../middleware/multer')
const upload = multerMiddleware.multer.single('image');

//initializing route
const router = express.Router();


//route definition for signin and signup
router.post('/signup',signController.userSignup);
router.post('/signin',signController.userSignin);



//route definition for password
router.post('/forgotpassword',passwordController.userResetpasswordMail)
router.get('/reset/:forgotId', passwordController.userResetpasswordform)
router.post('/password-reset',passwordController.userResetpassword)



//route definition for posting mesage and image
router.post('/post-message',authController.authorization,userControler.saveChatHistory)
router.post('/post-image',authController.authorization,upload,userControler.saveChatImages)



//route definition for getting user 
router.get('/get-user',authController.authorization,userControler.getcurrentuser)
router.get('/get-users',authController.authorization,userControler.getAlluser)



//route defintion for chat-history
router.get('/get-message',authController.authorization,userControler.getUserChatHistory);
router.get('/get-messages',userControler.getAllChatHistory);



//route definition for groups
router.post('/create-group',authController.authorization,userControler.createGroup)
router.post('/update-group',authController.authorization,userControler.updateGroup)
router.get('/get-groups',userControler.getAllgroups)
router.get('/get-mygroups',authController.authorization,userControler.getMygroups)
router.get('/get-group',userControler.getGroupbyId)
router.get('/get-group-messages',userControler.getGroupChatHistory)
router.get('/get-group-members',userControler.getGroupMembersbyId)



//route definition for redirecting to main page
router.get('/',mainPageController.getMainpage)



module.exports = router;