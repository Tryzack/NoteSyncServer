import { searchSpotify, getSpotifyArtists, getSpotifyArtist } from "../../utils/spotifyComponent.js";
import { find, insertMany } from "../../utils/dbComponent.js";

/**
 * Search for tracks
 * @param {String} req.query.filter - Required - The name of the track to search for
 * @param {Number} req.query.skip - Optional
 * @returns {Array} - The tracks found
 */
export default async function searchTracksByName(req, res) {
	const reqFilter = req.query.filter;
	const filter = { name: { $regex: ".*" + reqFilter + ".*", $options: "i" } };
	const sort = { popularity: -1 };
	const skip = req.query.skip ? parseInt(req.query.skip) : 0;
	const result = await find("track", filter, sort, 10, skip);
	if (result.error) {
		return res.status(500).json(result);
	}
	if (result.length < 10) {
		const newTrackIDs = [];
		const newArtistIDs = [];
		const newAlbumIDs = [];

		const newTracks = [];
		const newArtists = [];
		const newAlbums = [];

		const anotherNewTracks = [];
		const anotherNewArtists = [];
		const anotherNewAlbums = [];

		const responseTracks = [];
		let counter = 0;
		while (responseTracks.length + result.length < 10) {
			const resultError = await useSearchSpotify(
				reqFilter,
				counter * 10,
				10,
				newTrackIDs,
				newArtists,
				newArtistIDs,
				newAlbums,
				newAlbumIDs,
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
			if (!trackResult.find((track) => track.refId === id)) {
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
						refId: track.id,
						name: track.name,
						url: track.preview_url,
						cover_img: [...track.album.images],
						release_date: track.album.release_date,
						duration_ms: track.duration_ms,
						disc_number: track.disc_number,
						track_number: track.track_number,
						album: track.album.name,
						album_refId: track.album.id,
						artists: track.artists.map((artist) => {
							return { name: artist.name, id: artist.id };
						}),
						genres: genres,
						explicit: track.explicit,
						popularity: track.popularity,
						type: "Song",
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

async function useSearchSpotify(
	reqFilter,
	skip,
	limit,
	newTrackIDs,
	newArtists,
	newArtistIDs,
	newAlbums,
	newAlbumIDs,
	newTracks,
	responseTracks,
	result
) {
	const spotifyResult = await searchSpotify(`track:${reqFilter}`, ["track"], skip, limit);
	if (spotifyResult.error) {
		console.log("Error searching spotify", spotifyResult.error);
		return { error: "Internal server error" };
	}
	const items = spotifyResult.tracks.items || [];
	const toPush = [];

	for (const item of items) {
		const genres = [];
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

			newAlbums.push(item.album);
			newAlbumIDs.push(item.album.id);

			newTracks.push(item);
			newTrackIDs.push(item.id);

			const track = {
				id: item.id,
				name: item.name,
				url: item.preview_url,
				cover_img: [...item.album.images],
				release_date: item.album.release_date,
				duration_ms: item.duration_ms,
				disc_number: item.disc_number,
				track_number: item.track_number,
				album: item.album.name,
				album_refId: item.album.id,
				artists: item.artists.map((artist) => {
					return { name: artist.name, id: artist.id };
				}),
				genres: genres,
				explicit: item.explicit,
				popularity: item.popularity,
				type: "Song",
			};

			if (!result.find((track) => track.refId === item.id)) toPush.push(track); // Only add if not already in the database
		});
	}
	const alreadyInDatabase = await find("track", { refId: { $in: newTrackIDs } });
	console.log(alreadyInDatabase);
	if (alreadyInDatabase.error) {
		console.log("Error finding tracks", alreadyInDatabase.error);
		return res.status(500).json({ error: "Internal server error" });
	}

	for (const element of toPush) {
		if (!alreadyInDatabase.find((track) => track.refId === element.id)) {
			responseTracks.push(element);
		}
	}
	console.log("responseArtists", spotifyResult.tracks.items.length);
	if (spotifyResult.tracks.items.length < limit) {
		return;
	}
}
