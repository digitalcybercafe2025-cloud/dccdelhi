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
            upiId, upiPayeeName,
            appStartingFee, webStartingFee, designStartingFee, techStartingFee,
            privacyPolicy, termsAndConditions, disclaimer,
            heroAutoplay, heroInterval, heroShowIndicators, heroShowArrows, heroTransition,
            testimonialAutoplay, testimonialInterval, testimonialMinRating, testimonialShowAvatar
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

        // Digital solutions & service costs
        if (appStartingFee !== undefined) settings.appStartingFee = appStartingFee;
        if (webStartingFee !== undefined) settings.webStartingFee = webStartingFee;
        if (designStartingFee !== undefined) settings.designStartingFee = designStartingFee;
        if (techStartingFee !== undefined) settings.techStartingFee = techStartingFee;

        // Legal & policy content
        if (privacyPolicy !== undefined) settings.privacyPolicy = privacyPolicy;
        if (termsAndConditions !== undefined) settings.termsAndConditions = termsAndConditions;
        if (disclaimer !== undefined) settings.disclaimer = disclaimer;

        // Hero carousel settings
        if (heroAutoplay !== undefined) settings.heroAutoplay = Boolean(heroAutoplay);
        if (heroInterval !== undefined) settings.heroInterval = Number(heroInterval) || 5;
        if (heroShowIndicators !== undefined) settings.heroShowIndicators = Boolean(heroShowIndicators);
        if (heroShowArrows !== undefined) settings.heroShowArrows = Boolean(heroShowArrows);
        if (heroTransition !== undefined) settings.heroTransition = heroTransition;

        // Testimonial settings
        if (testimonialAutoplay !== undefined) settings.testimonialAutoplay = Boolean(testimonialAutoplay);
        if (testimonialInterval !== undefined) settings.testimonialInterval = Number(testimonialInterval) || 5;
        if (testimonialMinRating !== undefined) settings.testimonialMinRating = Number(testimonialMinRating) || 4;
        if (testimonialShowAvatar !== undefined) settings.testimonialShowAvatar = Boolean(testimonialShowAvatar);

        await settings.save();
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getSettings, updateSettings };
