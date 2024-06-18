import { insertOne, updateOne, deleteOne, findOne, checkUserPermissions } from "../utils/dbComponent.js";
import { ObjectId } from "mongodb";

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
