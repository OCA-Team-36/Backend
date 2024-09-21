const express = require('express');
const router = express.Router();
const authService = require('../services/auth/auth-service');
const campaignService = require('../services/campaign/campaign-service');
const verifyToken = require('../middleware/auth-middleware');
const multer = require('multer');

// Authentication Service
router.post('/auth/signup', authService.signUp);
router.post('/auth/signin', authService.signIn);
router.post('/auth/logout', verifyToken, authService.logout);
router.post('/auth/forgot-password', authService.resetPassword);
router.get('/auth/user-info', verifyToken, authService.getUserInfo);
router.put('/auth/update-user', verifyToken, authService.changeUserData);

// router.post('/campaign/make-campaign', verifyToken, campaignService.newcampaign);

module.exports=router;
