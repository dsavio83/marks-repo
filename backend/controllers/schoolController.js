const SchoolDetails = require('../models/SchoolDetails');

// @desc    Get school details
// @route   GET /api/school
// @access  Public
const getSchoolDetails = async (req, res) => {
    try {
        let details = await SchoolDetails.findOne();
        if (!details) {
            // Return empty object or demo data if not set
            return res.json({
                name: 'Smart School Pro',
                place: 'Chennai',
                schoolCode: '12345',
                headMasterName: 'Principal',
                address: 'School Address',
                reportLanguages: ['English', 'Tamil']
            });
        }
        res.json(details);
    } catch (error) {
        console.error('Get school details error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update school details
// @route   POST /api/school
// @access  Private (Admin only)
const updateSchoolDetails = async (req, res) => {
    try {
        const { name, place, schoolCode, headMasterName, address, reportLanguages } = req.body;

        let details = await SchoolDetails.findOne();

        if (details) {
            details.name = name;
            details.place = place;
            details.schoolCode = schoolCode;
            details.headMasterName = headMasterName;
            details.address = address;
            if (reportLanguages) details.reportLanguages = reportLanguages;
            details.updatedAt = new Date();
            await details.save();
        } else {
            details = new SchoolDetails({
                name,
                place,
                schoolCode,
                headMasterName,
                address,
                reportLanguages: reportLanguages || ['English', 'Tamil']
            });
            await details.save();
        }

        res.json(details);
    } catch (error) {
        console.error('Update school details error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getSchoolDetails,
    updateSchoolDetails
};
