import { insertOne, updateOne, deleteOne, findOne, checkUserPermissions } from "../utils/dbComponent.js";

export async function getTrack(req, res) {
	const track = req.query.trackId;
	const result = await findOne("track", { _id: track });
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}

export async function deleteTrack(req, res) {
	const permission = await checkUserPermissions(req.session.userId);
	if (permission.error) {
		return res.status(permission.status).json({ error: permission.error });
	}
	const track = req.body.trackId;
	const result = await deleteOne("track", { _id: track });
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}

export async function insertTrack(req, res) {
	const permission = await checkUserPermissions(req.session.userId);
	if (permission.error) {
		return res.status(permission.status).json({ error: permission.error });
	}
	const track = req.body.track;
	const result = await insertOne("track", track);
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}

export async function updateTrack(req, res) {
	const permission = await checkUserPermissions(req.session.userId);
	if (permission.error) {
		return res.status(permission.status).json({ error: permission.error });
	}
	const track = req.body.track;
	const result = await updateOne("track", { _id: track._id }, track);
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}
