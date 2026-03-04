import express from "express";
import argon2 from "argon2";
import { pool } from "./db.js";
import { bodyValues } from "./middleware.js";

const router = express.Router()
export default router

router.post("/register", bodyValues("username", "password", "email"), async (req, res) => {
    const username = String(req.body["username"]).trim();
    const email = String(req.body["email"]).trim();
    const password = await argon2.hash(String(req.body["password"]));

    await pool.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3)", [username, email, password]);

    res.end();
});

router.post("/login", bodyValues("username", "password"), async (req, res) => {
    const username = String(req.body["username"]).trim();
    const password = String(req.body["password"]);

    const record = (await pool.query("SELECT id, password FROM users WHERE username = $1", [username])).rows?.[0];
    const passwordHash = record?.["password"];

    if (typeof passwordHash === "undefined" || !await argon2.verify(passwordHash, password)) {
        res.sendStatus(401 /* Unauthorized */);
        return;
    }

    if (await argon2.needsRehash(passwordHash)) {
        const rehashed = await argon2.hash(password);
        await pool.query("UPDATE users SET password = $1 WHERE username = $2", [rehashed, username]);
    }

    req.session = {
        user: {
            id: record["user_id"],
            name: username,
        },
    };
    res.end();
});
