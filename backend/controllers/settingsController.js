const Settings = require('../models/Settings');

// @desc  Get settings (public)
// @route GET /api/settings
const getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc  Update settings (admin only)
// @route PUT /api/settings
const updateSettings = async (req, res) => {
    try {
        const {
            siteName, contactNumber, whatsapp, email, address, slogan, footerText,
            instagramUrl, facebookUrl, threadsUrl, twitterUrl, youtubeUrl, googleMapsUrl,
            upiId, upiPayeeName
        } = req.body;
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings();

        if (siteName !== undefined) settings.siteName = siteName;
        if (contactNumber !== undefined) settings.contactNumber = contactNumber;
        if (whatsapp !== undefined) settings.whatsapp = whatsapp;
        if (email !== undefined) settings.email = email;
        if (address !== undefined) settings.address = address;
        if (slogan !== undefined) settings.slogan = slogan;
        if (footerText !== undefined) settings.footerText = footerText;
        if (instagramUrl !== undefined) settings.instagramUrl = instagramUrl;
        if (facebookUrl !== undefined) settings.facebookUrl = facebookUrl;
        if (threadsUrl !== undefined) settings.threadsUrl = threadsUrl;
        if (twitterUrl !== undefined) settings.twitterUrl = twitterUrl;
        if (youtubeUrl !== undefined) settings.youtubeUrl = youtubeUrl;
        if (googleMapsUrl !== undefined) settings.googleMapsUrl = googleMapsUrl;
        if (upiId !== undefined) settings.upiId = upiId;
        if (upiPayeeName !== undefined) settings.upiPayeeName = upiPayeeName;

        await settings.save();
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getSettings, updateSettings };
