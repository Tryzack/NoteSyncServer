import { ObjectId } from "mongodb";
import { findOne, updateOne } from "../../utils/dbComponent.js";
import { sendEmail } from "../../utils/mailerComponent.js";
import { deleteResetKey, getResetKeys, setResetKey } from "../../utils/resetKeys.js";
import bcrypt from "bcrypt";

/**
 * Check if recovery code is valid
 * @param {String} req.body.email - Required
 * @param {String} req.body.code - Required
 * @returns {Object} - Response
 */
export async function recoveryCode(req, res) {
	if (!req.body.email || !req.body.code) {
		res.status(400).send({ message: "Missing fields" });
		return;
	}
	try {
		const user = await findOne("users", { user_email: req.body.email });
		if (!user) {
			res.status(400).send({ message: "User does not exist" });
			return;
		}
		const keys = getResetKeys();
		if (!keys[user.id]) {
			res.status(400).send({ message: "No recovery code sent" });
			return;
		}
		if (keys[user.id].key !== req.body.code) {
			res.status(400).send({ message: "Invalid code" });
			return;
		}
		res.status(200).send({ message: "Code is valid", response: true });
		setResetKey(user.id, { email: req.body.email, key: req.body.code, wasUsed: true });
	} catch (error) {
		console.error(error);
		res.status(500).send({ message: "Internal server error" });
	}
}

/**
 * Send an email with a recovery code to reset the password
 * @param {String} req.body.email - Required
 */
export async function forgotPassword(req, res) {
	if (!req.body.email) {
		res.status(400).send({ message: "Missing fields" });
		return;
	}

	const keys = getResetKeys();
	let user;
	try {
		user = await findOne("users", { user_email: req.body.email });
		if (!user) {
			res.status(400).send({ message: "User does not exist" });
			return;
		}
		if (keys[user.id]) {
			res.status(400).send({ message: "A recovery email has already been sent" });
			return;
		}
		const code = Math.floor(100000 + Math.random() * 900000);
		setResetKey(user.id, { email: req.body.email, key: code, wasUsed: false });
		const email = req.body.email;
		const subject = "ContactSync - Password recovery";
		const body = `
		<html>
	<head>
		<style>
			body {
			  font-family: Arial, sans-serif;
			  line-height: 1.5;
			}
			h2 {
			  color: #cf6b6b;
			}
			p {
			  margin-bottom: 10px;
			}
			strong {
			  color: #007bff;
			}
		</style>
	</head>
	<body>
		<h2>Password Recovery</h2>
		<p>Dear User,</p>
		<p>We have received a request for password recovery for your account.</p>
		<p>Your recovery code is:</p>
		<div style="
		display: flex; 
		background-color: #316fad; 
		padding: 10px; 
		margin: 0 auto; 
		height: 30px; 
		width: 50%;"
		>
			<p style="
			font-size: 20px;
			color: white;
			text-align: center;
            margin: 0;
			width: 100%;
			">${code}<p>
		</div>
		<p>Please use this code to reset your password. This code will expire in 10 minutes.</p>
		<p>If you did not request this password recovery, please ignore this email.</p>
		<p>Thank you,</p>
		<p style="color: #2b960b">ContactSync Team</p>
	</body>
</html>`;
		const type = "html";
		sendEmail({ email, subject, body, type }).then((response) => {
			setTimeout(() => {
				if (keys[user.id]) deleteResetKey(user.id);
			}, 600000);
			res.status(200).send({ message: "Email sent" });
		});
	} catch (error) {
		console.log(error);
		res.status(500).send({ message: "Error sending email" });
		if (keys[user.id]) deleteResetKey(user.id);
	}
}

/**
 * Changes the password of a user after verifying the recovery code
 * @param {String} req.body.email - Required
 * @param {String} req.body.newPassword - Required
 * @param {String} req.body.code - Required
 */
export async function recoveryPassword(req, res) {
	if (!req.body.email || !req.body.newPassword || !req.body.code) {
		res.status(400).send({ message: "Missing fields" });
		return;
	}
	try {
		const user = await findOne("users", { user_email: req.body.email });
		if (!user) {
			res.status(400).send({ message: "User does not exist" });
			return;
		}
		const keys = getResetKeys();
		if (!keys[user.id]) {
			res.status(400).send({ message: "No recovery code sent" });
			return;
		}
		if (!keys[user.id].wasUsed) {
			res.status(400).send({ message: "Something went wrong" });
			return;
		}
		if (keys[user.id].key !== req.body.code) {
			res.status(400).send({ message: "Invalid code" });
			return;
		}
		if (req.body.newPassword.length < 8) {
			res.status(400).send({ message: "Password must be at least 8 characters" });
			return;
		}
		const newPassword = await bcrypt.hash(req.body.newPassword, 10);
		const result = await updateOne("users", { _id: ObjectId.createFromHexString(user._id) }, { user_password: newPassword });
		if (!result) {
			res.status(500).send({ message: "Error updating password" });
			return;
		}
		deleteResetKey(user.id);
		const email = req.body.email;
		const subject = "ContactSync - Password changed";
		const body = `
<html>
	<head>
		<style>
			body {
			  font-family: Arial, sans-serif;
			  line-height: 1.5;
			}
			h2 {
			  color: #cf6b6b;
			}
			p {
			  margin-bottom: 10px;
			}
			strong {
			  color: #007bff;
			}
		</style>
	</head>
	<body>
		<h2>Password Updated</h2>
        <p>Dear User,</p>
        <p>Your password has been successfully updated.</p>
        <p>If you did not make this change, please contact us immediately.</p>
        <p>Best regards,</p>
        <p>ContactSync</p>
	</body>
</html>`;
		const type = "html";
		sendEmail({ email, subject, body, type });
		res.status(200).send({ message: "Password updated" });
	} catch (error) {
		console.error(error);
		res.status(500).send({ message: "Internal server error" });
	}
}
