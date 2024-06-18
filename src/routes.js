import { Router } from "express";

import { login, register, checkSession } from "./controllers/auth.js";
import searchTracksByName from "./controllers/search/searchTracksByName.js";
import searchTracksByAlbum from "./controllers/search/searchTracksByAlbum.js";
import searchTracksByGenre from "./controllers/search/searchTracksByGenre.js";
import searchArtist from "./controllers/search/searchArtist.js";

import { getTrack, updateTrack, insertTrack, deleteTrack } from "./controllers/track.js";

const routes = Router();

routes.post("/login", login);
routes.post("/register", register);
routes.get("/checkSession", checkSession);

routes.get("/searchTracksByName", searchTracksByName);
routes.get("/searchTracksByAlbum", searchTracksByAlbum);
routes.get("/searchTracksByGenre", searchTracksByGenre);
routes.get("/searchArtist", searchArtist);

routes.get("/track", getTrack);
routes.post("/track", insertTrack);
routes.put("/track", updateTrack);
routes.delete("/track", deleteTrack);

export default routes;
