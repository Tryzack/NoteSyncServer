import { insertOne, updateOne, deleteOne, findOne, checkUserPermissions, getRandomDocuments } from "../utils/dbComponent.js";

export async function getAlbum(req, res) {
	const album = req.query.albumId;
	const result = await findOne("album", { _id: album });
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}

export async function getRandomAlbums(req, res) {
	const result = await getRandomDocuments("album", 4);
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}

export async function deleteAlbum(req, res) {
	const permission = await checkUserPermissions(req.body.userId);
	if (permission.error) {
		return res.status(permission.status).json({ error: permission.error });
	}
	const album = req.body.albumId;
	const result = await deleteOne("album", { _id: album });
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}

export async function insertAlbum(req, res) {
	const permission = await checkUserPermissions(req.body.userId);
	if (permission.error) {
		return res.status(permission.status).json({ error: permission.error });
	}
	const album = req.body.album;
	const result = await insertOne("album", album);
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}

export async function updateAlbum(req, res) {
	const permission = await checkUserPermissions(req.body.userId);
	if (permission.error) {
		return res.status(permission.status).json({ error: permission.error });
	}
	const album = req.body.album;
	const result = await updateOne("album", { _id: album._id }, album);
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}
