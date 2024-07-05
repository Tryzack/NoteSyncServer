import { Router } from "express";

import { login, register, checkSession, logout, unregister } from "./controllers/auth.js";
import searchTracksByName from "./controllers/search/searchTracksByName.js";
import searchTracksByGenre from "./controllers/search/searchTracksByGenre.js";
import searchAlbums from "./controllers/search/searchAlbum.js";
import searchArtist from "./controllers/search/searchArtist.js";

import getTracksByAlbum from "./controllers/get/getTracksByAlbum.js";
import getAlbumByArtist from "./controllers/get/getAlbumByArtist.js";

import { getUploadedTracks, updateTrack, insertTrack, deleteTrack } from "./controllers/track.js";
import { toggleLike, getLikedSongs } from "./controllers/Likes.js";

import { recoveryCode, recoveryPassword, forgotPassword } from "./controllers/update/RecoveryPassword.js";

import { getPlaylists, insertPlaylist, deletePlaylist, updatePlaylist } from "./controllers/playlist.js";

import { getArtist } from "./controllers/artist.js";

const routes = Router();

routes.post("/auth/login", login);
routes.post("/auth/register", register);
routes.get("/auth/checkSession", checkSession);
routes.get("/auth/logout", logout);
routes.delete("/auth/unregister", unregister);

routes.get("/search/TracksByName", searchTracksByName);
routes.get("/search/TracksByGenre", searchTracksByGenre);
routes.get("/search/Artist", searchArtist);
routes.get("/search/Albums", searchAlbums);

routes.get("/get/TracksByAlbum", getTracksByAlbum);
routes.get("/get/AlbumByArtist", getAlbumByArtist);
routes.get("/get/uploadedTracks", getUploadedTracks);
routes.get("/get/likedSongs", getLikedSongs);

routes.get("/artist", getArtist);

routes.post("/track", insertTrack);
routes.put("/track", updateTrack);
routes.delete("/track", deleteTrack);

routes.post("/toggleLike", toggleLike);

routes.post("/passwordRecovery/recoveryCode", recoveryCode);
routes.post("/passwordRecovery/recoveryPassword", recoveryPassword);
routes.post("/passwordRecovery/forgotPassword", forgotPassword);

routes.get("/playlist", getPlaylists);
routes.post("/playlist", insertPlaylist);
routes.delete("/playlist", deletePlaylist);
routes.put("/playlist", updatePlaylist);

export default routes;
