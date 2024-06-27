import express from "express";
import session from "express-session";
import routes from "./src/routes.js";
import dotenv from "dotenv";
import cors from "cors";
import * as dbComponent from "./src/utils/dbComponent.js";
dotenv.config();

const app = express();

const port = process.env.PORT || 3000;
const secret = process.env.SESSION_SECRET;
const sessionName = process.env.SESSION_NAME;

const sessionStore = new session.MemoryStore({
	checkPeriod: 1000 * 60 * 60 * 24,
	max: 100,
});

const sessionOptions = {
	secret: secret,
	resave: false,
	saveUninitialized: false,
	store: sessionStore,
	cookie: {
		name: sessionName,
		maxAge: 1000 * 60 * 60 * 24,
		secure: false,
		httpOnly: true,
	},
};

app.use(session(sessionOptions))
	.use(express.json())
	.use(express.urlencoded({ extended: true }))
	.use(routes)
	.use((req, res, next) => {
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Access-Control-Allow-Origin", "localhost:4200");
		res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
		res.setHeader("Access-Control-Allow-Headers", "Content-Type");
		next();
	});

if (sessionOptions.cookie.secure) {
	app.set("trust proxy", 1);
}

app.get("/", (req, res) => {
	// test server
	res.status(200).send({ message: "Hello world from BeatSyncBackend" });
});

dbComponent.connectToDB();

app.listen(port, () => {
	console.log("Server running on port " + port);
});
