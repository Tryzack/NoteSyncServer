import { getAlbumsByArtist } from "../../utils/spotifyComponent.js";
import { find, insertMany } from "../../utils/dbComponent.js";

/**
 * get for albums by artist
 * @param {String} req.query.reqFilter - Required - The name of the artist to get for
 * @param {Number} req.query.skip - Optional (default: 0)
 * @returns {Array} - The albums found
 */
export default async function getAlbumByArtist(req, res) {
	const reqFilter = req.query.filter;
	if (!reqFilter) {
		return res.status(400).json({ error: "Missing required parameter artistId" });
	}
	const filter = { "artists.id": reqFilter };
	const sort = { popularity: -1 };
	const skip = req.query.skip ? parseInt(req.query.skip) : 0;
	try {
		const response = await find("album", filter, sort, 10, skip);
		if (response.error) {
			return res.status(500).json(response);
		}
		if (response.length < 10) {
			const newAlbumIDs = [];

			const newAlbums = [];

			const anotherNewAlbums = [];

			const responseAlbums = [];

			let counter = 0;
			while (responseAlbums.length + response.length < 10) {
				const resultError = await usegetSpotify(reqFilter, counter * 10, 10, newAlbumIDs, newAlbums, responseAlbums, response);
				if (resultError) {
					if (resultError.error) return res.status(500).json(resultError);
					if (resultError.done) break;
				}
				counter++;
			}
			res.send([...response, ...responseAlbums]);

			const albumResult = await find("album", { refId: { $in: newAlbumIDs } });
			if (albumResult.error) {
				console.log("Error finding albums", albumResult.error);
			}

			newAlbumIDs.forEach((id, index) => {
				if (!albumResult.find((album) => album.refId === id)) {
					if (!anotherNewAlbums.find((album) => album.id === id)) {
						anotherNewAlbums.push(newAlbums[index]);
					}
				}
			});

			if (anotherNewAlbums.length > 0) {
				const insertAlbums = [];
				for (const album of anotherNewAlbums) {
					insertAlbums.push({
						refId: album.id,
						name: album.name,
						release_date: album.release_date,
						images: [...album.images],
						artists: album.artists.map((artist) => {
							return { name: artist.name, id: artist.id };
						}),
						total_tracks: album.total_tracks,
						type: "Album",
					});
				}
				const insertResult = await insertMany("album", insertAlbums);
				if (insertResult.error) {
					console.log("Error inserting albums", insertResult.error);
				}
			}
		} else {
			res.send(response);
		}
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
}

async function usegetSpotify(reqFilter, skip, limit, newAlbumIDs, newAlbums, responseAlbums, result) {
	const spotifyResult = await getAlbumsByArtist(reqFilter, limit, skip);
	if (spotifyResult.error) {
		return { error: spotifyResult.error };
	}
	const items = spotifyResult.items;
	const toPush = [];

	for (const item of items) {
		newAlbumIDs.push(item.id);
		newAlbums.push(item);

		const album = {
			refId: item.id,
			name: item.name,
			release_date: item.release_date,
			images: [...item.images],
			artists: item.artists.map((artist) => {
				return artist.id;
			}),
			total_tracks: item.total_tracks,
			type: "Album",
		};
		console.log("album", album);
		if (!result.find((album) => album.refId === item.id)) {
			toPush.push(album);
		}
	}
	const alreadyInDatabase = await find("album", { refId: { $in: newAlbumIDs } });

	if (alreadyInDatabase.error) {
		console.log("Error finding albums", alreadyInDatabase.error);
		return res.status(500).json({ error: "Internal server error" });
	}

	for (const element of toPush) {
		if (!alreadyInDatabase.find((album) => album.refId === element.id)) {
			responseAlbums.push(element);
		}
	}

	if (spotifyResult.items.length < limit) {
		return { done: true };
	}
}
