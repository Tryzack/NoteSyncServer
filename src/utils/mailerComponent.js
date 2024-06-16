import nodemailer from "nodemailer";

/**
 * @param {Object} email - Email to send
 * @param {string} email.email - Email to send
 * @param {string} email.subject - Email subject
 * @param {string} email.body - Email body
 * @param {string} email.type - Email type (text or html)
 * @returns {string} - Email response
 */
export async function sendEmail({ email, subject, body, type = "text" }) {
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.EMAIL,
			pass: process.env.EMAILPASSWORD,
		},
	});

	const mailOptions = {
		from: process.env.EMAIL,
		to: email,
		subject: subject,
	};
	if (type === "html") {
		mailOptions.html = body;
	} else {
		mailOptions.text = body;
	}

	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			throw new Error(error);
		} else {
			return info.response;
		}
	});
}
