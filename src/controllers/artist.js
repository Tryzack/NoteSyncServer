import { insertOne, updateOne, deleteOne, findOne, checkUserPermissions } from "../utils/dbComponent.js";

export async function getArtist(req, res) {
	const artist = req.query.artistId ? req.query.artistId : req.query.artistRefId;
	const result = await findOne("artist", { $or: [{ _id: artist }, { refId: artist }] });
	if (result.error) {
		return res.status(500).json(result);
	}

	return res.status(200).json(result);
}

export async function deleteArtist(req, res) {
	const permission = await checkUserPermissions(req.body.userId);
	if (permission.error) {
		return res.status(permission.status).json({ error: permission.error });
	}
	const artist = req.body.artistId;
	const result = await deleteOne("artist", { _id: artist });
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}

export async function insertArtist(req, res) {
	const permission = await checkUserPermissions(req.body.userId);
	if (permission.error) {
		return res.status(permission.status).json({ error: permission.error });
	}
	const artist = req.body.artist;
	const result = await insertOne("artist", artist);
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}

export async function updateArtist(req, res) {
	const permission = await checkUserPermissions(req.body.userId);
	if (permission.error) {
		return res.status(permission.status).json({ error: permission.error });
	}
	const artist = req.body.artist;
	const result = await updateOne("artist", { _id: artist._id }, artist);
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}
