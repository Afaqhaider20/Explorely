const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const uploadToCloudinary = async (file, folder = 'explorely') => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            folder: folder,
            use_filename: true
        });

        // Delete file from server after upload
        fs.unlinkSync(file.path);
        
        return result.secure_url;
    } catch (error) {
        // Delete file from server if upload failed
        if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        throw error;
    }
};

module.exports = { uploadToCloudinary };
