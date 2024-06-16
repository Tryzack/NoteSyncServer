import { Router } from "express";

import { login, register, checkSession } from "./controllers/auth.js";
import searchTracks from "./controllers/searchTracks.js";

const routes = Router();

routes.post("/login", login);
routes.post("/register", register);
routes.get("/checkSession", checkSession);
routes.get("/searchTracks", searchTracks);

export default routes;
