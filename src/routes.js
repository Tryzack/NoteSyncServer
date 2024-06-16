import { Router } from "express";

import { login, register, checkSession } from "./controllers/auth.js";

const routes = Router();

routes.post("/login", login);
routes.post("/register", register);
routes.get("/checkSession", checkSession);

export default routes;
