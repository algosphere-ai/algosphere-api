const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const connectDB = require("./mongo");
const { default: mongoose } = require("mongoose");
const { OpenAI } = require("openai");
dotenv.config();

const app = express();
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});
var db = mongoose.connection;
connectDB();

app.use(express.json());
app.use(
	cors({
		origin: "*",
		preflightContinue: false,
		optionsSuccessStatus: 200,
	})
);

app.get("/", (req, res) => {
	res.redirect("https://algosphereai.xyz");
});

app.get("/api/agent/:name", async (req, res) => {
	try {
		let agent = await db
			.collection("agents")
			.findOne({ name: req.params.name });
		res.json({
			exists: agent ? true : false,
		});
	} catch (error) {
		console.log("Error in /api/agent : ", error);
		res.status(500).json({ message: "Internal server error" });
	}
});

app.get("/api/get-agent/:name", async (req, res) => {
	try {
		let agent = await db
			.collection("agents")
			.findOne({ name: req.params.name });
		if (agent) {
			res.json(agent);
		} else {
			res.status(404).json({ message: "Agent not found" });
		}
	} catch (error) {
		console.log("Error in /api/get-agent : ", error);
		res.status(500).json({ message: "Internal server error" });
	}
});

app.post("/api/add-agent", async (req, res) => {
	try {
		let data = req.body;
		if (data.name && data.details) {
			await db.collection("agents").insertOne({
				name: data.name,
				...details,
			});
			res.json({ message: "Agent added successfully" });
		} else {
			res.status(400).json({ message: "Invalid request" });
		}
	} catch (error) {
		console.log("Error in /api/add-agent : ", error);
		res.status(500).json({ message: "Internal server error" });
	}
});

app.post("/api/interact/:name", async (req, res) => {
	const { name } = req.params;
	const { message } = req.body;

	if (!message) {
		return res.status(400).json({ message: "Message parameter missing!" });
	}

	try {
		const agent = await db.collection("agents").findOne({ name });
		if (!agent) {
			return res.status(404).json({ message: "Agent not found!" });	
		}

		const response = await openai.chat.completions.create({
			model: "gpt-3.5-turbo",
			messages: [
				{
					role: "system",
					content: `You are ${agent.name}. An AI Agent or Assistant with the following personality: ${agent?.personality || "neutral."} ${agent.description || ""}`,
				},
				{
					role: "user",
					content: message,
				}
			]
		});
		const reply = response.data.choices[0].message.content || "Sorry, I cannot answer your question at the moment.";
		res.json({ agent: agent.name, reply });
	} catch (error) {
		console.log("Error in /api/interact : ", error);
		return res.status(500).json({ message: "Internal server error" });
	}
});

app.listen(process.env.PORT || 3000, () => {
	console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
