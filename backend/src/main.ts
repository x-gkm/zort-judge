import "dotenv/config";
import express from "express";
import auth from "./auth.js";
import api from "./api.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(auth);
app.use(api);

app.listen(8080);