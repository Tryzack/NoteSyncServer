import { findOne, insertOne, find, deleteOne } from "../utils/dbComponent.js";

/**
 * Toggle like on a song
 * @param {Request} req.session.userId - The user's session
 * @param {Request} req.body.songRefId - The song to like
 * @returns {Response} res - The response
 */
export async function toggleLike(req, res) {
	const userId = req.body.userId;
	const songRefId = req.body.songRefId;
	if (!userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}
	let liked = false;
	try {
		const like = await findOne("likes", { songRefId, userId });
		if (like.error) {
			return res.status(500).json(like);
		}
		if (Object.keys(like).length > 0) {
			const result = await deleteOne("likes", { songRefId, userId });
			if (result.error) {
				return res.status(500).json(result);
			}
		} else {
			const result = await insertOne("likes", { songRefId, userId });
			if (result.error) {
				return res.status(500).json(result);
			}
			liked = true;
		}
		return res.status(200).json({ message: "Success", liked: liked });
	} catch (error) {
		return res.status(500).json({ error: error });
	}
}

/**
 * Get all liked songs for the current user
 * @param {Request} req.session.userId - The user's session
 * @returns {Response} res - The response
 */
export async function getLikedSongs(req, res) {
	const userId = req.body.userId;
	if (!userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}
	const likes = await find("likes", { userId });
	if (likes.error) {
		return res.status(500).json(likes);
	}
	const songResult = await find("track", { id: { $in: likes.map((like) => like.songRefId) } });
	if (songResult.error) {
		return res.status(500).json(songResult);
	}
	return res.status(200).json(songResult);
}
