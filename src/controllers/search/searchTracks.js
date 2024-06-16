import { searchSpotify, getSpotifyArtists, getSpotifyArtist } from "../../utils/spotifyComponent.js";
import { find, insertMany, findOne, connectToDB, closeDB } from "../../utils/dbComponent.js";

/**
 * Search for tracks
 * @param {String} req.query.filter - Required
 * @param {Number} req.query.skip - Optional
 * @returns {Array} - The tracks found
 */
export default async function searchTracks(req, res) {
	const connected = await connectToDB();
	if (connected.error) {
		return res.status(500).json(connected);
	}
	const reqFilter = req.query.filter;
	const filter = { name: { $regex: ".*" + reqFilter + ".*", $options: "i" } };
	const sort = { name: 1 };
	const skip = req.query.skip ? parseInt(req.query.skip) : 0;
	const result = await find("track", filter, sort, 10, skip);
	const limit = 10 - result.length;
	if (result.error) {
		return res.status(500).json(result);
	}
	if (result.length < 10) {
		const spotifyResult = await searchSpotify(reqFilter, ["track"], skip, limit);
		if (spotifyResult.error) {
			console.log("Error searching spotify", spotifyResult.error);
			return res.status(500).json({ error: "Internal server error" });
		}
		const items = spotifyResult.tracks.items || [];

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
					name: item.name,
					url: item.preview_url,
					cover_img: [...item.album.images],
					release_date: item.album.release_date,
					duration_ms: item.duration_ms,
					disc_number: item.disc_number,
					track_number: item.track_number,
					album: item.album.name,
					artists: item.artists.map((artist) => artist.name),
					genres: genres,
				};
				responseTracks.push(track);
			});
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
						artists: track.artists.map((artist) => artist.name),
						genres: genres,
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
