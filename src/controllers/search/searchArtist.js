import { searchSpotify, getSpotifyArtists } from "../../utils/spotifyComponent.js";
import { find, insertMany, findOne } from "../../utils/dbComponent.js";

export default async function searchArtist(req, res) {
	const reqFilter = req.query.filter;
	const filter = {
		name: { $regex: ".*" + reqFilter + ".*", $options: "i" },
	};
	const sort = { popularity: -1 };
	const skip = req.query.skip ? parseInt(req.query.skip) : 0;
	const result = await find("artist", filter, sort, 10, skip);
	if (result.error) {
		return res.status(500).json(result);
	}
	if (result.length < 10) {
		const newArtistIDs = [];
		const newArtists = [];
		const anotherNewArtists = [];

		const responseArtists = [];

		let counter = 0;
		while (responseArtists.length + result.length < 10) {
			const resultError = await useSearchSpotify(reqFilter, counter * 10, 10, newArtistIDs, newArtists, responseArtists, result);
			if (resultError) {
				if (resultError.error) return res.status(500).json(resultError);
				if (resultError.done) break;
			}
			counter++;
			console.log("counter", counter);
		}

		res.send([...result, ...responseArtists]);

		const artistResult = await find("artist", { refId: { $in: newArtistIDs } });
		if (artistResult.error) {
			console.log("Error finding artists", artistResult.error);
		}
		let index = 0;
		for (const id of newArtistIDs) {
			const artistResult = await findOne("artist", { refId: id });
			if (artistResult.error) {
				console.log("Error finding artist", artistResult.error);
			}
			if (Object.keys(artistResult).length === 0) {
				anotherNewArtists.push(newArtists[index]);
			}
			index++;
		}

		if (anotherNewArtists.length > 0) {
			const insertArtists = [];
			for (const artist of anotherNewArtists) {
				insertArtists.push({
					refId: artist.id,
					name: artist.name,
					genres: artist.genres,
					images: [...artist.images],
					popularity: artist.popularity,
				});
			}
			const result = await insertMany("artist", insertArtists);
			if (result.error) {
				console.log("Error inserting artists", result.error);
			}
		}
	} else {
		res.send(result);
	}
}

async function useSearchSpotify(reqFilter, skip, limit, newArtistIDs, newArtists, responseArtists, result) {
	const spotifyResult = await searchSpotify(`artist:${reqFilter}`, ["artist"], skip, limit);
	if (spotifyResult.error) {
		console.log("Error searching spotify", spotifyResult.error);
		return { error: spotifyResult.error };
	}
	const items = spotifyResult.artists.items || [];
	const toPush = [];
	for (const item of items) {
		newArtists.push(item);
		newArtistIDs.push(item.id);

		const artist = {
			id: item.id,
			name: item.name,
			genres: item.genres,
			images: [...item.images],
			popularity: item.popularity,
		};
		if (!result.find((artist) => artist.refId === item.id)) toPush.push(artist); // Only add if not already in the database
	}
	const alreadyInDatabase = await find("artist", { refId: { $in: newArtistIDs } });
	if (alreadyInDatabase.error) {
		console.log("Error finding artists", alreadyInDatabase.error);
		return { error: alreadyInDatabase.error };
	}
	// check in elements inside toPush are already in the database, if so, do not add them to the responseArtists
	for (const element of toPush) {
		if (!alreadyInDatabase.find((artist) => artist.refId === element.id)) {
			responseArtists.push(element);
		}
	}
	console.log("responseArtists", spotifyResult.artists.items.length);
	if (spotifyResult.artists.items < limit) return { done: "No more artists to search for" };
}
