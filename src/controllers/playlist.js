import { insertOne, updateOne, deleteOne, find } from "../utils/dbComponent.js";
import { ObjectId } from "mongodb";

/**
 * Get all playlists for the current user
 * @param {Request} req.session.userId - The user's session
 * @returns {Response} res - The response
 */
export async function getPlaylists(req, res) {
	if (!req.query.userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}
	const result = await find("playlist", { userId: req.query.userId });
	if (result.error) {
		return res.status(500).json(result);
	}
	for (const playlist of result) {
		const songIds = playlist.songIds;
		const songs = await find("track", { refId: { $in: songIds } });
		playlist.songs = songs;
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
	if (!req.body.userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}
	const playlist = req.body.id;
	const result = await deleteOne("playlist", { _id: ObjectId.createFromHexString(playlist), userId: req.body.userId });
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json({ message: "Playlist deleted" });
}

/**
 * Insert a new playlist for the current user
 * @param {Request} req.session.userId - The user's session
 * @param {Request} req.body.playlist - The playlist to insert
 * @returns {Response} res - The response
 */
export async function insertPlaylist(req, res) {
	if (!req.body.userId) {
		return res.status(401).json({ error: "Unauthorized" });
	}
	if (!req.body.name) {
		return res.status(400).json({ error: "Bad request" });
	}
	const result = await insertOne("playlist", {
		name: req.body.name,
		userId: req.body.userId,
		description: req.body.description || "",
		songIds: [],
	});
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}

/**
 * Update a specific playlist for the current user
 * @param {Request} req.session.userId - The user's session
 * @param {Request} req.body.id - The playlist to update
 * @param {Request} req.body.playlist.name - The new name of the playlist
 * @param {Request} req.body.playlist.description - The new description of the playlist
 * @param {Request} req.body.playlist.songIds - The new songIds of the playlist
 * @returns {Response} res - The response
 */
export async function updatePlaylist(req, res) {
	try {
		if (!req.body.userId) {
			return res.status(401).json({ error: "Unauthorized" });
		}
		if (!req.body.name) {
			return res.status(400).json({ error: "Bad request" });
		}
		const result = await updateOne(
			"playlist",
			{ _id: ObjectId.createFromHexString(req.body.id), userId: req.body.userId },
			{ name: req.body.name, description: req.body.description || "", songIds: req.body.songIds ?? [] }
		);
		if (result.error) {
			return res.status(500).json(result);
		}
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({ error: "Internal Server Error" + error });
	}
}
