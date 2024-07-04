import { ObjectId } from "mongodb";
import { insertOne, updateOne, deleteOne, findOne, checkUserPermissions, find } from "../utils/dbComponent.js";
import { uploadSong } from "../utils/firebaseComponent.js";
import formidable from "formidable";

export async function getUploadedTracks(req, res) {
	if (!req.query.userId) return res.status(401).json({ error: "Unauthorized" });
	const result = await find("track", { userId: req.query.userId });
	if (result.error) {
		return res.status(500).json(result);
	}
	return res.status(200).json(result);
}

export async function deleteTrack(req, res) {
	if (req.body.userId) return res.status(401).json({ error: "Unauthorized" });
	try {
		const permission = await checkUserPermissions(req.body.userId);
		if (permission.error) {
			return res.status(permission.status).json({ error: permission.error });
		}
		const trackId = req.body.trackId;
		const result = await findOne("track", { _id: ObjectId.createFromHexString(trackId), userId: req.body.userId });
		if (result.error) return res.status(500).json(result);
		if (Object.keys(result).length === 0) return res.status(404).json({ error: "Track not found" });
		if (result.userId !== req.body.userId) return res.status(403).json({ error: "You are not allowed to delete this track" });

		const deleteResult = await deleteOne("track", { _id: ObjectId.createFromHexString(trackId) });
		if (deleteResult.error) return res.status(500).json(result);

		return res.status(200).json({ message: "Track deleted" });
	} catch (error) {
		return res.status(500).json({ error: error });
	}
}

/**
 * Insert a new track
 * @param {Request} req.body.songName - The name of the song
 * @param {Request} req.body.songArtist - The artist of the song (can be multiple)
 * @param {Request} req.body.songFile - The song file to upload
 * @param {Request} req.body.songDuration - The duration of the song in milliseconds
 * @param {Request} req.body.songReleaseDate - The release date of the song (default: current date)
 * @param {Request} req.body.songDiscNumber - The disc number of the song (default: 1)
 * @param {Request} req.body.songTrackNumber - The track number of the song (default: 1)
 * @param {Request} req.body.songGenres - The genres of the song (can be multiple)
 * @returns {Response} res - The response
 */
export async function insertTrack(req, res) {
	if (!req.body.userId) return res.status(401).json({ error: "Unauthorized" });
	try {
		const track = {};
		const permission = await checkUserPermissions(req.body.userId);
		if (permission?.error) {
			return res.status(permission.status).json({ error: permission.error });
		}
		const form = formidable({ multiple: false });
		form.parse(req, (err, fields, files) => {
			try {
				if (err) return res.status(500).json({ error: err });
				const filePath = files["songFile"][0]?.filepath;
				if (!filePath) return res.status(400).json({ error: "Song file is required" });
				track.name = fields["songName"][0];
				track.artists = fields["songArtist"];
				track.cover_img = [];
				track.duration_ms = fields["songDuration"] ? parseInt(fields["songDuration"][0]) : 0;
				track.release_date = fields["songReleaseDate"] ? fields["songReleaseDate"][0] : new Date().toISOString();
				track.disc_number = fields["songDiscNumber"] ? parseInt(fields["songDiscNumber"][0]) : 1;
				track.track_number = fields["songTrackNumber"] ? parseInt(fields["songTrackNumber"][0]) : 1;
				track.album = "";
				track.album_refId = "";
				track.genres = fields["songGenres"]; // ? fields["songGenres"].split(",") : [];
				track.popularity = 100;
				uploadSong(filePath).then((result) => {
					if (result.error) return res.status(500).json(result);
					track.songUrl = result.url;
					track.refId = result.refId;

					insertOne("track", { ...track, userId: req.body.userId }).then((result) => {
						if (result.error) return res.status(500).json(result);
						return res.status(200).json(result);
					});
				});
			} catch (error) {
				console.log(error);
				return res.status(500).json({ error: "Error parsing form data" });
			}
		});
	} catch (error) {
		return res.status(500).json({ error: "Internal Server Error\n", error });
	}
}

export async function updateTrack(req, res) {
	if (!req.body.userId) return res.status(401).json({ error: "Unauthorized" });
	try {
		const permission = await checkUserPermissions(req.body.userId);
		if (permission.error) {
			return res.status(permission.status).json({ error: permission.error });
		}
		const track = req.body.track;
		const trackId = req.body.trackId;
		const result = await findOne("track", { _id: ObjectId.createFromHexString(trackId) });
		if (result.error) {
			return res.status(500).json(result);
		}
		if (Object.keys(result).length === 0) return res.status(404).json({ error: "Track not found" });

		if (result.userId !== req.body.userId) return res.status(403).json({ error: "You are not allowed to update this track" });

		const updateResult = await updateOne(
			"track",
			{ _id: ObjectId.createFromHexString(trackId) },
			{
				name: track.name,
				artists: track.artists,
				release_date: track.release_date,
				disc_number: track.disc_number,
				track_number: track.track_number,
				genres: track.genres,
			}
		);
		if (updateResult.error) {
			return res.status(500).json(updateResult);
		}
		res.status(200).json(updateResult);
	} catch (error) {
		return res.status(500).json({ error: error });
	}
}
