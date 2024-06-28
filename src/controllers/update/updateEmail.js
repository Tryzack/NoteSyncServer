import { ObjectId } from "mongodb";
import { findOne, updateOne } from "../../utils/dbComponent.js";

/**
 * Update user email
 * @param {String} req.body.newEmail - Required
 */
export async function updateUserEmail(req, res) {
	if (!req.session.userId) {
		res.status(401).send({ message: "Unauthorized" });
		return;
	}

	if (!req.body.newEmail) {
		res.status(400).send({ message: "Missing fields" });
		return;
	}
	const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
	if (!regex.test(req.body.newEmail)) {
		res.status(402).send({ message: "Invalid email format" });
		return;
	}
	try {
		const user = await findOne("users", { _id: ObjectId.createFromHexString(req.session.userId) });
		if (Object.keys(user).length === 0) {
			res.status(401).send({ message: "User does not exist" });
			return;
		}
		// valid if email already exists
		const userByEmail = await findOne("users", { user_email: req.body.newEmail });
		if (Object.keys(userByEmail).length > 0) {
			res.status(403).send({ message: "Email already exists" });
			return;
		}

		const result = await updateOne("users", { _id: ObjectId.createFromHexString(req.session.userId) }, { user_email: req.body.newEmail });
		if (result.error) return res.status(500).send({ message: "Error updating user" });
		res.status(200).send({ message: "User updated" });
	} catch (error) {
		console.log(error);
		res.status(500).send({ message: "Error updating user" });
	}
}
