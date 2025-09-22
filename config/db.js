const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGOURLI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        console.log('Continuing without database for endpoint testing...');
        // Don't exit for now to allow endpoint testing
        // process.exit(1); // Exit process with failure
    }
};

module.exports = { connectDB };