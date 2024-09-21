

class Campagin {
    async newcampaign(req, res){
        try {
            // mengambil data dari request body
            const { templateType, content } = req.body;

            if (templateType === 'manual') {
                console.log('Manual content: ', content);
            } else if (templateType === 'automatic'){
                console.log("using automatic template");
            }

            res.status(200).json({
                message: 'Campaign created succesfully!'
            });
        } catch (error) {
            console.error('Error creating campaign:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new Campagin();