import { Router } from "express";

import { login, register, checkSession } from "./controllers/auth.js";
import searchTracksByName from "./controllers/search/searchTracksByName.js";
import searchTracksByAlbum from "./controllers/search/searchTracksByAlbum.js";
import searchTracksByGenre from "./controllers/search/searchTracksByGenre.js";
import searchArtist from "./controllers/search/searchArtist.js";
import searchAlbumByArtist from "./controllers/search/searchAlbumByArtist.js";

import { getTrack, updateTrack, insertTrack, deleteTrack } from "./controllers/track.js";

const routes = Router();

routes.post("/auth/login", login);
routes.post("/auth/register", register);
routes.get("/auth/checkSession", checkSession);

routes.get("/search/TracksByName", searchTracksByName);
routes.get("/search/TracksByGenre", searchTracksByGenre);
routes.get("/search/Artist", searchArtist);

routes.get("/get/TracksByAlbum", searchTracksByAlbum);
routes.get("/get/AlbumByArtist", searchAlbumByArtist);

routes.get("/track", getTrack);
routes.post("/track", insertTrack);
routes.put("/track", updateTrack);
routes.delete("/track", deleteTrack);

export default routes;
