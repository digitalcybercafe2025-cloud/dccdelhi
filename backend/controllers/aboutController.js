const About = require('../models/About');
const path = require('path');
const fs = require('fs');

exports.getAbout = async (req, res) => {
    try {
        let about = await About.findOne();
        if (!about) {
            about = await About.create({});
        }
        res.status(200).json({ success: true, data: about });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAbout = async (req, res) => {
    try {
        let about = await About.findOne();
        if (!about) {
            about = new About({});
        }

        const { title, subtitle, description, missionTitle, mission, visionTitle, vision, experience, address, phone, expertise, isVisible } = req.body;

        if (title !== undefined) about.title = title;
        if (subtitle !== undefined) about.subtitle = subtitle;
        if (description !== undefined) about.description = description;
        if (missionTitle !== undefined) about.missionTitle = missionTitle;
        if (mission !== undefined) about.mission = mission;
        if (visionTitle !== undefined) about.visionTitle = visionTitle;
        if (vision !== undefined) about.vision = vision;
        if (experience !== undefined) about.experience = experience;
        if (address !== undefined) about.address = address;
        if (phone !== undefined) about.phone = phone;

        if (expertise !== undefined) {
            about.expertise = Array.isArray(expertise) ? expertise : JSON.parse(expertise);
        }
        if (isVisible !== undefined) about.isVisible = isVisible === 'true' || isVisible === true;

        if (req.file) {
            about.imageUrl = `/uploads/${req.file.filename}`;
        } else if (req.body.imageUrl !== undefined && req.body.imageUrl.trim() !== '') {
            // allows setting a string URL if no file provided
            about.imageUrl = req.body.imageUrl.trim();
        }

        await about.save();
        res.status(200).json({ success: true, data: about });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
