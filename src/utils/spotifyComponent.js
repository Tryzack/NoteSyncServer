// spotify component
// This component is used to get api data from spotify and send it to the database (not axios)
import { findOne, updateOne } from "./dbComponent.js";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

//get a new token from spotify
async function getNewToken() {
	fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			grant_type: "client_credentials",
			client_id: clientId,
			client_secret: clientSecret,
		}),
	})
		.then((res) => res.json())
		.then((data) => {
			updateOne("tokens", { name: "spotify" }, { access_token: data.access_token, expires: Date.now() + 3600 * 1000 });
			return data.access_token;
		});
}

//get the spotify token from the database or get a new one if it has expired
async function getSpotifyData() {
	const token = await findOne("tokens", { name: "spotify" });
	if (token.error) {
		throw new Error("Internal server error");
	}
	if (!token || token.expires < Date.now()) {
		const token = await getNewToken();
		return token;
	} else {
		return token.access_token;
	}
}

//gets
/**
 * Search spotify
 * @param {String} query - Required
 * @param {Array} types - Optional (default: ["track"])
 * @param {Number} offset - Optional (default: 0)
 */
export async function searchSpotify(query, types = ["track"], offset = 0, limit = 10) {
	try {
		const token = await getSpotifyData();
		const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=${types.join(",")}&limit=${limit}&offset=${offset}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return response.json();
	} catch (error) {
		console.error(error);
		return { error: "Internal server error" };
	}
}
/**
 * Get an artist from spotify
 * @param {String} id - Required
 */
export async function getSpotifyArtist(id) {
	try {
		const token = await getSpotifyData();
		const response = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return response.json();
	} catch (error) {
		console.error(error);
		return { error: "Internal server error" };
	}
}

/**
 * Get multiple artists from spotify
 * @param {Array} ids - Required
 */
export async function getSpotifyArtists(ids) {
	try {
		const token = await getSpotifyData();
		const respose = await fetch(`https://api.spotify.com/v1/artists?ids=${ids.join(",")}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return respose.json();
	} catch (error) {
		console.error(error);
		return { error: "Internal server error" };
	}
}

/**
 * Get an album from spotify
 * @param {String} id - Required
 */
export async function getSpotifyAlbum(id) {
	try {
		const token = await getSpotifyData();
		const respose = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return respose.json();
	} catch (error) {
		console.error(error);
		return { error: "Internal server error" };
	}
}

/**
 * Get multiple albums from spotify
 * @param {Array} ids - Required
 */
export async function getSpotifyAlbums(ids) {
	try {
		const token = await getSpotifyData();
		const respose = await fetch(`https://api.spotify.com/v1/albums?ids=${ids.join(",")}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return respose.json();
	} catch (error) {
		console.error(error);
		return { error: "Internal server error" };
	}
}

/**
 * Get a track from spotify
 * @param {String} id - Required
 */
export async function getSpotifyTrack(id) {
	try {
		const token = await getSpotifyData();
		const respose = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return respose.json();
	} catch (error) {
		console.error(error);
		return { error: "Internal server error" };
	}
}

/**
 * Get multiple tracks from spotify
 * @param {Array} ids - Required
 */
export async function getSpotifyTracks(ids) {
	try {
		const token = await getSpotifyData();
		const respose = await fetch(`https://api.spotify.com/v1/tracks?ids=${ids}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return respose.json();
	} catch (error) {
		console.error(error);
		return { error: "Internal server error" };
	}
}
