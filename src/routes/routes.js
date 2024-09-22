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

// Routes for campaign management
router.post('/campaign', campaignService.createCampaign); // Step 1
router.put('/campaign/template', campaignService.chooseTemplate); // Step 2
router.get('/campaign/:campaignId/review', campaignService.reviewCampaign); // Step 3
router.put('/campaign/:campaignId/finalize', campaignService.finalizeCampaign); // Step 4
router.get('/campaigns/reports', campaignService.getReports); // Step 5

// Route to blast the campaign via email or WhatsApp
router.post('/campaign/:campaignId/blast', campaignService.blastCampaign);

module.exports=router;
