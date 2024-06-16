import { Router } from "express";

import { login, register, checkSession } from "./controllers/auth.js";
import searchTracks from "./controllers/search/searchTracks.js";
import { getTrack, updateTrack, insertTrack, deleteTrack } from "./controllers/track.js";

const routes = Router();

routes.post("/login", login);
routes.post("/register", register);
routes.get("/checkSession", checkSession);
routes.get("/searchTracks", searchTracks);

routes.get("/track", getTrack);
routes.post("/track", insertTrack);
routes.put("/track", updateTrack);
routes.delete("/track", deleteTrack);

export default routes;
