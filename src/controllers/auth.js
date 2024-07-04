import bcrypt from "bcrypt";
import { findOne, insertOne } from "../utils/dbComponent.js";

/**
 * Register a new user
 * @param {String} req.body.email - Required
 * @param {String} req.body.password - Required
 */
export async function register(req, res) {
	if (req.body.userId) {
		res.status(200).send({ message: "Already logged in" });
		return;
	}
	if (!req.body.email || !req.body.password) {
		res.status(400).send({ message: "Missing fields" });
		return;
	}
	try {
		let user = await findOne("users", { user_email: req.body.email });
		if (Object.keys(user).length !== 0) {
			res.status(409).send({ message: "User already exists" });
			return;
		}
		const hashedPassword = await bcrypt.hash(req.body.password, 10);
		const result = await insertOne("users", { user_email: req.body.email, user_password: hashedPassword });
		if (result) {
			res.send({ message: "User created" });
		} else {
			res.status(500).send({ message: "Internal server error" });
		}
	} catch (error) {
		console.error(error);
		res.status(500).send({ message: "Internal server error" });
	}
}

/**
 * Log in
 * @param {String} req.body.email - Required
 * @param {String} req.body.password - Required
 */
export async function login(req, res) {
	if (req.query.userId) {
		res.status(200).send({ message: "Already logged in" });
		return;
	}
	if (!req.body.email || !req.body.password) {
		res.status(400).send({ message: "Missing fields" });
		return;
	}
	try {
		let user = await findOne("users", { user_email: req.body.email });
		if (Object.keys(user).length === 0) {
			res.status(404).send({ message: "User not found" });
			return;
		}
		if (await bcrypt.compare(req.body.password, user.user_password)) {
			req.session.userId = user._id;
			res.send({ message: "Logged in", sessionId: user._id });
		} else {
			res.status(401).send({ message: "Incorrect Password" });
		}
	} catch (error) {
		console.error(error);
		res.status(500).send({ message: "Internal server error" });
	}
}

/**
 * Check if user is logged in
 */
export function checkSession(req, res) {
	if (req.query.userId) {
		res.send({ message: "Logged in" });
	} else {
		res.status(401).send({ message: "Not logged in" });
	}
}

/**
 * Log out
 */
export function logout(req, res) {
	res.send({ message: "Logged out" });
}
