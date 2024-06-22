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
	try {
		const permission = await checkUserPermissions(req.session.userId);
		if (permission.error) {
			return res.status(permission.status).json({ error: permission.error });
		}
		const track = req.body.trackId;
		const result = await findOne("track", { _id: track });
		if (result.error) {
			return res.status(500).json(result);
		}
		if (result.userId !== req.session.userId) {
			return res.status(403).json({ error: "You are not allowed to delete this track" });
		}
		const deleteResult = await deleteOne("track", { _id: track });
		if (deleteResult.error) {
			return res.status(500).json(result);
		}
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({ error: error });
	}
}

export async function insertTrack(req, res) {
	try {
		const track = req.body.track;
		const permission = await checkUserPermissions(req.session.userId);
		if (permission.error) {
			return res.status(permission.status).json({ error: permission.error });
		}
		const result = await insertOne("track", { ...track, userId: req.session.userId });
		if (result.error) {
			return res.status(500).json(result);
		}
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({ error: error });
	}
}

export async function updateTrack(req, res) {
	try {
		const permission = await checkUserPermissions(req.session.userId);
		if (permission.error) {
			return res.status(permission.status).json({ error: permission.error });
		}
		const track = req.body.track;
		const trackId = req.body.trackId;
		const result = await findOne("track", { _id: trackId });
		if (result.error) {
			return res.status(500).json(result);
		}
		if (result.userId !== req.session.userId) {
			return res.status(403).json({ error: "You are not allowed to update this track" });
		}
		const updateResult = await updateOne("track", { _id: trackId }, track);
		if (updateResult.error) {
			return res.status(500).json(updateResult);
		}
		res.status(200).json(updateResult);
	} catch (error) {
		return res.status(500).json({ error: error });
	}
}
