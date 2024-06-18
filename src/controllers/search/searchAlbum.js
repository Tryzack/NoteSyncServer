import { searchSpotify, getSpotifyArtists, getSpotifyArtist } from "../../utils/spotifyComponent.js";
import { find, insertMany, findOne, connectToDB, closeDB } from "../../utils/dbComponent.js";

export default async function searchAlbums(req, res) {
	if (connected.error) {
		return res.status(500).json(connected);
	}
	const reqFilter = req.query.filter;
	const filter = { name: { $regex: ".*" + reqFilter + ".*", $options: "i" } };
	const sort = { name: 1 };
	const skip = req.query.skip ? parseInt(req.query.skip) : 0;
	const result = await find("album", filter, sort, 10, skip);
	const limit = 10 - result.length;
	if (result.error) {
		return res.status(500).json(result);
	}
	if (result.length < 10) {
		const spotifyResult = await searchSpotify(reqFilter, ["album"], skip, limit);
		if (spotifyResult.error) {
			console.log("Error searching spotify", spotifyResult.error);
			return res.status(500).json({ error: "Internal server error" });
		}
		const items = spotifyResult.albums.items || [];

		const newAlbumIDs = [];
		const newArtistIDs = [];

		const newAlbums = [];
		const newArtists = [];

		const anotherNewAlbums = [];
		const anotherNewArtists = [];

		const responseAlbums = [];
		for (const item of items) {
			item.artists.forEach((artist) => {
				newArtists.push(artist);
				newArtistIDs.push(artist.id);
			});

			newAlbums.push(item);
			newAlbumIDs.push(item.id);

			const album = {
				name: item.name,
				release_date: item.release_date,
				images: [...item.images],
				artists: item.artists.map((artist) => artist.name),
				total_tracks: item.total_tracks,
			};
			responseAlbums.push(album);
		}
		res.send([...result, ...responseAlbums]);

		const artistResult = await find("artist", { refId: { $in: newArtistIDs } });
		if (artistResult.error) {
			console.log("Error finding artists", artistResult.error);
		}

		newArtistIDs.forEach((id, index) => {
			if (!artistResult.find((artist) => artist.refId === id)) {
				if (!anotherNewArtists.find((artist) => artist.id === id)) {
					anotherNewArtists.push(newArtists[index]);
				}
			}
		});

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

		if (anotherNewArtists.length > 0) {
			const insertArtists = [];
			for (const artist of anotherNewArtists) {
				await getSpotifyArtist(artist.id).then((data) => {
					insertArtists.push({
						refId: artist.id,
						name: data.name,
						genres: data.genres,
						images: [...data.images],
					});
				});
			}
			insertMany("artist", [...insertArtists]).then((result) => {
				if (result.error) {
					console.log("Error inserting artists", result.error);
				}
			});
		}

		if (anotherNewAlbums.length > 0) {
			const insertAlbums = [];
			for (const album of anotherNewAlbums) {
				insertAlbums.push({
					refId: album.id,
					name: album.name,
					release_date: album.release_date,
					images: [...album.images],
					artists: album.artists.map((artist) => artist.name),
					total_tracks: album.total_tracks,
				});
			}
			const result = await insertMany("album", insertAlbums);
			if (result.error) {
				console.log("Error inserting albums", result.error);
			}
		}
	} else {
		res.send(result);
	}
}
