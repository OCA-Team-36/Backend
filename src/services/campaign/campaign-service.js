const db = require("../../config/firebase").db;
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

class CampaignService {
    // Step 1: New Campaign creation
    async createCampaign(req, res) {
        try {
            const { campaignName, groupContact, blastType } = req.body;

            // Check if all required fields are provided
            if (!campaignName || !groupContact || !blastType) {
                return res.status(400).json({
                    error: "All fields (campaignName, groupContact, blastType) are required",
                });
            }

            // Prepare campaign data
            const newCampaign = {
                campaignName,
                groupContact,
                blastType,
                createdAt: new Date(),
                status: "Draft", // Initially, the campaign will be in draft status
            };

            // Store the campaign in the database
            const campaignRef = await db.collection("campaigns").add(newCampaign);

            res.status(201).json({
                message: "Campaign created successfully",
                campaignId: campaignRef.id,
                campaign: newCampaign,
            });
        } catch (error) {
            console.error("Error creating campaign:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // Step 2: Choose Template (manual or automatic)
    async chooseTemplate(req, res) {
        try {
            const { campaignId, templateType, content } = req.body;

            if (!campaignId || !templateType) {
                return res.status(400).json({ error: "campaignId and templateType are required" });
            }

            const campaignRef = db.collection("campaigns").doc(campaignId);

            // Check if campaign exists
            const campaignDoc = await campaignRef.get();
            if (!campaignDoc.exists) {
                return res.status(404).json({ error: "Campaign not found" });
            }

            // Update campaign with template details
            const updateData = {
                templateType,
            };

            if (templateType === "manual" && content) {
                updateData.content = content; // Manual campaign content (rich text)
            }

            await campaignRef.update(updateData);

            res.status(200).json({
                message: "Template chosen successfully",
                templateType,
                content: content || null,
            });
        } catch (error) {
            console.error("Error choosing template:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // Step 3: Review Campaign
    async reviewCampaign(req, res) {
        try {
            const { campaignId } = req.params;

            // Fetch campaign details for review
            const campaignRef = db.collection("campaigns").doc(campaignId);
            const campaignDoc = await campaignRef.get();

            if (!campaignDoc.exists) {
                return res.status(404).json({ error: "Campaign not found" });
            }

            const campaignData = campaignDoc.data();

            res.status(200).json({
                message: "Campaign details fetched successfully",
                campaign: campaignData,
            });
        } catch (error) {
            console.error("Error reviewing campaign:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // Step 4: Finalize Campaign
    async finalizeCampaign(req, res) {
        try {
            const { campaignId } = req.params;

            const campaignRef = db.collection("campaigns").doc(campaignId);

            // Check if campaign exists
            const campaignDoc = await campaignRef.get();
            if (!campaignDoc.exists) {
                return res.status(404).json({ error: "Campaign not found" });
            }

            // Update status to "Finalized"
            await campaignRef.update({ status: "Finalized", finalizedAt: new Date() });

            res.status(200).json({
                message: "Campaign finalized successfully",
            });
        } catch (error) {
            console.error("Error finalizing campaign:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // Step 5: Reporting
    async getReports(req, res) {
        try {
            // Fetch all campaigns for reporting
            const campaignsSnapshot = await db.collection("campaigns").get();

            const campaigns = campaignsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            res.status(200).json({
                message: "Campaigns fetched successfully",
                campaigns,
            });
        } catch (error) {
            console.error("Error fetching reports:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // Function to send WhatsApp Blast
    async sendWhatsApp(campaignId, recipients, messageContent) {
        try {
            const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

            for (const recipient of recipients) {
                await client.messages.create({
                    from: fromNumber,
                    body: messageContent,
                    to: `whatsapp:${recipient.phone}`  // Assuming recipient has a 'phone' field
                });
            }

            console.log('WhatsApp messages sent successfully!');
        } catch (error) {
            console.error('Error sending WhatsApp messages:', error);
        }
    }

    // Function to trigger Blast based on the selected type
    async blastCampaign(req, res) {
        const { campaignId, blastType, recipients, subject, content, messageContent } = req.body;

        try {
            // Validate input
            if (!campaignId || !blastType || !recipients || recipients.length === 0) {
                return res.status(400).json({ error: 'Missing required fields for campaign blast' });
            }

            if (blastType === 'email') {
                // Send Email Blast
                await this.sendEmail(campaignId, recipients, subject, content);
                return res.status(200).json({ message: 'Email campaign sent successfully' });
            } else if (blastType === 'whatsapp') {
                // Send WhatsApp Blast (handled below)
                await this.sendWhatsApp(campaignId, recipients, messageContent);
                return res.status(200).json({ message: 'WhatsApp campaign sent successfully' });
            } else {
                return res.status(400).json({ error: 'Invalid blast type' });
            }
        } catch (error) {
            console.error('Error sending blast:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new CampaignService();
