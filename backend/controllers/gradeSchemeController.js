const GradeScheme = require('../models/GradeScheme');

// Get all grade schemes
const getAllGradeSchemes = async (req, res) => {
    try {
        const gradeSchemes = await GradeScheme.find().sort({ createdAt: -1 });
        res.json(gradeSchemes);
    } catch (error) {
        console.error('Error fetching grade schemes:', error);
        res.status(500).json({ message: 'Error fetching grade schemes', error: error.message });
    }
};

// Get grade scheme by ID
const getGradeSchemeById = async (req, res) => {
    try {
        const gradeScheme = await GradeScheme.findById(req.params.id);

        if (!gradeScheme) {
            return res.status(404).json({ message: 'Grade scheme not found' });
        }

        res.json(gradeScheme);
    } catch (error) {
        console.error('Error fetching grade scheme:', error);
        res.status(500).json({ message: 'Error fetching grade scheme', error: error.message });
    }
};

// Get grade schemes by class
const getGradeSchemesByClass = async (req, res) => {
    try {
        const { className } = req.params;
        const gradeSchemes = await GradeScheme.find({
            applicableClasses: className
        }).sort({ createdAt: -1 });

        res.json(gradeSchemes);
    } catch (error) {
        console.error('Error fetching grade schemes by class:', error);
        res.status(500).json({ message: 'Error fetching grade schemes', error: error.message });
    }
};

// Create grade scheme
const createGradeScheme = async (req, res) => {
    try {
        const { name, applicableClasses, boundaries } = req.body;

        // Validate required fields
        if (!name || !applicableClasses || !boundaries) {
            return res.status(400).json({
                message: 'Name, applicable classes, and boundaries are required'
            });
        }

        // Validate boundaries
        if (!Array.isArray(boundaries) || boundaries.length === 0) {
            return res.status(400).json({
                message: 'At least one grade boundary is required'
            });
        }

        const gradeScheme = new GradeScheme({
            name,
            applicableClasses,
            boundaries
        });

        await gradeScheme.save();
        res.status(201).json(gradeScheme);
    } catch (error) {
        console.error('Error creating grade scheme:', error);
        res.status(500).json({ message: 'Error creating grade scheme', error: error.message });
    }
};

// Update grade scheme
const updateGradeScheme = async (req, res) => {
    try {
        const { name, applicableClasses, boundaries } = req.body;

        const gradeScheme = await GradeScheme.findById(req.params.id);

        if (!gradeScheme) {
            return res.status(404).json({ message: 'Grade scheme not found' });
        }

        // Update fields
        if (name) gradeScheme.name = name;
        if (applicableClasses) gradeScheme.applicableClasses = applicableClasses;
        if (boundaries) gradeScheme.boundaries = boundaries;
        gradeScheme.updatedAt = Date.now();

        await gradeScheme.save();
        res.json(gradeScheme);
    } catch (error) {
        console.error('Error updating grade scheme:', error);
        res.status(500).json({ message: 'Error updating grade scheme', error: error.message });
    }
};

// Delete grade scheme
const deleteGradeScheme = async (req, res) => {
    try {
        const gradeScheme = await GradeScheme.findById(req.params.id);

        if (!gradeScheme) {
            return res.status(404).json({ message: 'Grade scheme not found' });
        }

        await GradeScheme.findByIdAndDelete(req.params.id);
        res.json({ message: 'Grade scheme deleted successfully' });
    } catch (error) {
        console.error('Error deleting grade scheme:', error);
        res.status(500).json({ message: 'Error deleting grade scheme', error: error.message });
    }
};

module.exports = {
    getAllGradeSchemes,
    getGradeSchemeById,
    getGradeSchemesByClass,
    createGradeScheme,
    updateGradeScheme,
    deleteGradeScheme
};
