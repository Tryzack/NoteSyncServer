import { insertOne, updateOne, deleteOne, findOne, checkUserPermissions } from "../utils/dbComponent.js";
import { ObjectId } from "mongodb";

/**
 * Get all playlists for the current user
 * @param {Request} req.session.userId - The user's session
 * @returns {Response} res - The response
 */
export async function getPlaylists(req, res) {
	if (!req.session.userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}
	const result = await findOne("playlist", { userId: ObjectId(req.session.userId) });
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}

/**
 * Get a specific playlist for the current user
 * @param {Request} req.session.userId - The user's session
 * @param {Request} req.query.playlistId - The playlist to get
 * @returns {Response} res - The response
 */
export async function getPlaylist(req, res) {
	if (!req.session.userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}
	const playlist = req.query.playlistId;
	const result = await findOne("playlist", { _id: playlist, userId: ObjectId(req.session.userId) });
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}

/**
 * Delete a specific playlist for the current user
 * @param {Request} req.session.userId - The user's session
 * @param {Request} req.body.playlistId - The playlist to delete
 * @returns {Response} res - The response
 */
export async function deletePlaylist(req, res) {
	if (!req.session.userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}
	const playlist = req.body.playlistId;
	const result = await deleteOne("playlist", { _id: playlist, userId: ObjectId(req.session.userId) });
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}

/**
 * Insert a new playlist for the current user
 * @param {Request} req.session.userId - The user's session
 * @param {Request} req.body.playlist - The playlist to insert
 * @returns {Response} res - The response
 */
export async function insertPlaylist(req, res) {
	if (!req.session.userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}
	const playlist = req.body.playlist;
	playlist.userId = ObjectId(req.session.userId);
	const result = await insertOne("playlist", playlist);
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}

/**
 * Update a specific playlist for the current user
 * @param {Request} req.session.userId - The user's session
 * @param {Request} req.body.playlist - The playlist to update
 * @returns {Response} res - The response
 */
export async function updatePlaylist(req, res) {
	if (!req.session.userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}
	const playlist = req.body.playlist;
	const result = await updateOne("playlist", { _id: playlist._id, userId: ObjectId(req.session.userId) }, playlist);
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}
