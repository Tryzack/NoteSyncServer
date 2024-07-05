import { getSpotifyTracksByAlbum, getSpotifyArtists, getSpotifyArtist, getSpotifyAlbum } from "../../utils/spotifyComponent.js";
import { find, insertMany } from "../../utils/dbComponent.js";

/**
 * get for tracks
 * @param {String} req.query.filter - Required - The ID of the album to get for
 * @param {Number} req.query.skip - Optional
 * @returns {Array} - The tracks found
 */
export default async function getTracksByAlbum(req, res) {
	const reqFilter = req.query.filter;
	const filter = { album_refId: reqFilter };
	const sort = { popularity: -1 };
	const skip = req.query.skip ? parseInt(req.query.skip) : 0;
	const result = await find("track", filter, sort, 10, skip);
	console.log("result", result);
	if (result.error) {
		return res.status(500).json(result);
	}
	if (result.length < 10) {
		const newAlbumIDs = [];
		const newAlbums = [];
		const anotherNewAlbums = [];
		const findAlbum = await find("album", { refId: reqFilter });
		if (findAlbum.error) {
			console.log("Error finding album", findAlbum.error);
			return res.status(500).json({ error: "Internal server error" });
		}
		if (findAlbum.length < 1) {
			const spotifyAlbum = await getSpotifyAlbum(reqFilter);
			if (spotifyAlbum.error) {
				console.log("Error getting album from spotify", spotifyAlbum.error);
				return res.status(500).json({ error: "Internal server error" });
			}
			newAlbums.push(spotifyAlbum);
			newAlbumIDs.push(spotifyAlbum.id);
		} else {
			newAlbums.push(findAlbum[0]);
			newAlbumIDs.push(findAlbum[0].refId);
		}

		const newTrackIDs = [];
		const newArtistIDs = [];

		const newTracks = [];
		const newArtists = [];

		const anotherNewTracks = [];
		const anotherNewArtists = [];

		const responseTracks = [];
		let counter = 0;
		while (responseTracks.length + result.length < 10) {
			const resultError = await usegetSpotify(
				reqFilter,
				counter * 10,
				10,
				newTrackIDs,
				newArtists,
				newArtistIDs,
				newAlbums,
				newTracks,
				responseTracks,
				result
			);
			if (resultError) {
				if (resultError.error) return res.status(500).json(resultError);
				if (resultError.done) break;
			}
			counter++;
		}

		res.send([...result, ...responseTracks]);

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

		const trackResult = await find("track", { refId: { $in: newTrackIDs } });
		if (trackResult.error) {
			console.log("Error finding tracks", trackResult.error);
		}

		newTrackIDs.forEach((id, index) => {
			if (!trackResult.find((track) => track.id === id)) {
				if (!anotherNewTracks.find((track) => track.id === id)) {
					anotherNewTracks.push(newTracks[index]);
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
				insertAlbums.push({
					refId: album.id,
					name: album.name,
					release_date: album.release_date,
					images: [...album.images],
					artists: album.artists.map((artist) => {
						return { name: artist.name, id: artist.id };
					}),
					total_tracks: album.total_tracks,
				});
			}
			const result = await insertMany("album", insertAlbums);
			if (result.error) {
				console.log("Error inserting albums", result.error);
			}
		}

		if (anotherNewTracks.length > 0) {
			const insertTracks = [];
			for (const track of anotherNewTracks) {
				const genres = [];
				await getSpotifyArtists(track.artists.map((artist) => artist.id)).then((artists) => {
					artists.artists.forEach((artist) => {
						artist.genres.forEach((genre) => {
							if (!genres.includes(genre)) {
								genres.push(genre);
							}
						});
					});
					insertTracks.push({
						id: track.id,
						name: track.name,
						url: track.preview_url,
						cover_img: newAlbums[0].images ?? [],
						release_date: newAlbums[0].release_date,
						duration_ms: track.duration_ms,
						disc_number: track.disc_number,
						track_number: track.track_number,
						album: newAlbums[0].name,
						album_refId: reqFilter,
						artists: track.artists.map((artist) => {
							return { name: artist.name, id: artist.id };
						}),
						genres: genres,
						popularity: track.popularity,
					});
				});
			}
			const result = await insertMany("track", insertTracks);
			if (result.error) {
				console.log("Error inserting tracks", result.error);
			}
		}
	} else {
		res.send(result);
	}
}

async function usegetSpotify(reqFilter, skip, limit, newTrackIDs, newArtists, newArtistIDs, newAlbums, newTracks, responseTracks, result) {
	const spotifyResult = await getSpotifyTracksByAlbum(reqFilter, skip, limit);
	if (spotifyResult.error) {
		console.log("Error geting spotify", spotifyResult.error);
		return { error: "Internal server error" };
	}
	const items = spotifyResult.items || [];
	const toPush = [];

	for (const item of items) {
		const genres = [];
		try {
			await getSpotifyArtists(item.artists.map((artist) => artist.id)).then((artists) => {
				artists.artists.forEach((artist) => {
					artist.genres.forEach((genre) => {
						if (!genres.includes(genre)) {
							genres.push(genre);
						}
					});
				});
				item.artists.forEach((artist) => {
					newArtists.push(artist);
					newArtistIDs.push(artist.id);
				});

				newTracks.push(item);
				newTrackIDs.push(item.id);

				const track = {
					id: item.id,
					name: item.name,
					url: item.preview_url,
					cover_img: newAlbums[0].images ?? [],
					release_date: newAlbums[0].release_date,
					duration_ms: item.duration_ms,
					disc_number: item.disc_number,
					track_number: item.track_number,
					album: newAlbums[0].name,
					album_refId: reqFilter,
					artists: item.artists.map((artist) => {
						return { name: artist.name, id: artist.id };
					}),
					genres: genres,
					popularity: item.popularity,
				};

				if (!result.find((track) => track.refId === item.id)) toPush.push(track); // Only add if not already in the database
			});
		} catch (error) {
			console.log(error);
			return { error: "Internal server error" };
		}
	}
	const alreadyInDatabase = await find("track", { refId: { $in: newTrackIDs } });
	if (alreadyInDatabase.error) {
		console.log("Error finding tracks", alreadyInDatabase.error);
		return { error: "Internal server error" };
	}

	for (const element of toPush) {
		if (!alreadyInDatabase.find((track) => track.refId === element.id)) {
			responseTracks.push(element);
		}
	}
	if (spotifyResult.items.length < limit) {
		return { done: true };
	}
}
