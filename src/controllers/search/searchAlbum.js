import { searchSpotify, getSpotifyArtists, getSpotifyArtist } from "../../utils/spotifyComponent.js";
import { find, insertMany } from "../../utils/dbComponent.js";

export default async function searchAlbums(req, res) {
	try {
		const reqFilter = req.query.filter;
		const filter = { name: { $regex: ".*" + reqFilter + ".*", $options: "i" } };
		const sort = {};
		const skip = req.query.skip ? parseInt(req.query.skip) : 0;
		const result = await find("album", filter, sort, 10, skip);
		if (result.error) {
			return res.status(500).json(result);
		}
		if (result.length < 10) {
			const newAlbumIDs = [];
			const newArtistIDs = [];

			const newAlbums = [];
			const newArtists = [];

			const anotherNewAlbums = [];
			const anotherNewArtists = [];

			const responseAlbums = [];
			let counter = 0;
			while (responseAlbums.length + result.length < 10) {
				const resultError = await useSearchSpotify(
					reqFilter,
					counter * 10,
					10,
					newAlbumIDs,
					newArtists,
					newArtistIDs,
					newAlbums,
					responseAlbums,
					result
				);
				if (resultError) {
					if (resultError.error) return res.status(500).json(resultError);
					if (resultError.done) break;
				}
				counter++;
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
							popularity: data.popularity,
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
					console.log(album);
					insertAlbums.push({
						refId: album.id,
						name: album.name,
						release_date: album.release_date,
						cover_img: [...album.images],
						artists: album.artists.map((artist) => {
							return { name: artist.name, id: artist.id };
						}),
						total_tracks: album.total_tracks,
						popularity: album.popularity,
						type: "Album",
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
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: "Internal server error" });
	}
}

async function useSearchSpotify(reqFilter, skip, limit, newAlbumIDs, newArtists, newArtistIDs, newAlbums, responseAlbums, result) {
	const spotifyResult = await searchSpotify(`album:${reqFilter}`, ["album"], skip, limit);
	if (spotifyResult.error) {
		console.log("Error searching spotify", spotifyResult.error);
		return { error: "Internal server error" };
	}
	const items = spotifyResult.albums.items || [];
	const toPush = [];

	for (const item of items) {
		item.artists.forEach((artist) => {
			newArtists.push(artist);
			newArtistIDs.push(artist.id);
		});
		newAlbums.push(item);
		newAlbumIDs.push(item.id);
		console.log(item.artists);
		const album = {
			refId: item.id,
			name: item.name,
			release_date: item.release_date,
			cover_img: [...item.images],
			artists: item.artists.map((artist) => {
				return artist.name;
			}),
			total_tracks: item.total_tracks,
			type: "Album",
		};
		if (!result.find((album) => album.refId === item.id)) toPush.push(album); // Only add if not already in the database
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

	if (spotifyResult.albums.items.length < limit) {
		return;
	}
}
