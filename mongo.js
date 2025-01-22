const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {
	try {
		mongoose.connect(process.env.MONGODB_URI, {
			dbName: "ai-agent",
		});

		console.log("Connected to MongoDB");
	} catch (error) {
		console.log(error);
	}
};

module.exports = connectDB;
