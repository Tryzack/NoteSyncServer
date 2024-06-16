// spotify component
// This component is used to get api data from spotify and send it to the database (not axios)
import dotenv from "dotenv";
import { findOne, updateOne } from "./dbComponent.js";

dotenv.config();

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

//get a new token from spotify
function getNewToken() {
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
			return data;
		});
}

//get the spotify token from the database or get a new one if it has expired
async function getSpotifyData() {
	const token = await findOne("tokens", { name: "spotify" });
	if (!token || token.expires < Date.now()) {
		getNewToken();
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
export async function searchSpotify(query, types = ["track"], offset = 0) {
	const limit = 10;
	const token = await getSpotifyData();
	const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=${types.join(",")}&limit=${limit}&offset=${offset}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.json();
}
/**
 * Get an artist from spotify
 * @param {String} id - Required
 */
export async function getSpotifyArtist(id) {
	const token = await getSpotifyData();
	const respose = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return respose.json();
}

/**
 * Get multiple artists from spotify
 * @param {Array} ids - Required
 */
export async function getSpotifyArtists(ids) {
	const token = await getSpotifyData();
	const respose = await fetch(`https://api.spotify.com/v1/artists?ids=${ids.join(",")}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return respose.json();
}

/**
 * Get an album from spotify
 * @param {String} id - Required
 */
export async function getSpotifyAlbum(id) {
	const token = await getSpotifyData();
	const respose = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return respose.json();
}

/**
 * Get multiple albums from spotify
 * @param {Array} ids - Required
 */
export async function getSpotifyAlbums(ids) {
	const token = await getSpotifyData();
	const respose = await fetch(`https://api.spotify.com/v1/albums?ids=${ids.join(",")}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return respose.json();
}

/**
 * Get a track from spotify
 * @param {String} id - Required
 */
export async function getSpotifyTrack(id) {
	const token = await getSpotifyData();
	const respose = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return respose.json();
}

/**
 * Get multiple tracks from spotify
 * @param {Array} ids - Required
 */
export async function getSpotifyTracks(ids) {
	const token = await getSpotifyData();
	const respose = await fetch(`https://api.spotify.com/v1/tracks?ids=${ids}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return respose.json();
}
