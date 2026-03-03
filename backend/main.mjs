import "dotenv/config";
import express from "express";
import argon2 from "argon2";
import pg from "pg";

const pool = new pg.Pool({
    connectionString: process.env["DATABASE_URL"],
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function bodyValues(...values) {
    return (req, res, next) => {
        const missing = values.filter(value => typeof req.body?.[value] === "undefined");
        if (missing.length > 0) {
            throw new Error(`Missing body fields: ${missing.join(", ")}`);
        }
        next();
    }
}

app.post("/register", bodyValues("username", "password", "email"), async (req, res) => {
    const username = String(req.body["username"]).trim();
    const email = String(req.body["email"]).trim();
    const password = await argon2.hash(String(req.body["password"]));

    await pool.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3)", [username, email, password]);

    res.end();
});

app.post("/login", bodyValues("username", "password"), async (req, res) => {
    const username = String(req.body["username"]).trim();
    const password = String(req.body["password"]);

    const passwordHash = (await pool.query("SELECT password FROM users WHERE username = $1", [username])).rows?.[0]?.["password"];

    if (typeof passwordHash === "undefined" || !await argon2.verify(passwordHash, password)) {
        res.sendStatus(401 /* Unauthorized */);
        return;
    }

    if (await argon2.needsRehash(passwordHash)) {
        const rehashed = await argon2.hash(password);
        await pool.query("UPDATE users SET password = $1 WHERE username = $2", [rehashed, username]);
    }

    // TODO(gkm): Set a session cookie.
    res.end();
});

// TODO(gkm): Implement pagination.
app.get("/contests", async (req, res) => {
    res.send((await pool.query("SELECT id, name FROM contests ORDER BY start_date DESC")).rows);
});

app.get("/contests/:id", async (req, res) => {
    const contest = (await pool.query("SELECT * FROM contests WHERE id = $1", [req.params.id])).rows?.[0];

    if (typeof contest === "undefined") {
        res.sendStatus(404 /* Not found */);
        return;
    }

    const now = new Date();
    const ongoing = contest["start_date"] <= now && now <= contest["end_date"];

    const problems = (await pool.query("SELECT id, name from problems WHERE contest_id = $1", [contest["id"]])).rows;
    res.send({
        ...contest,
        ongoing,
        problems,
    });
})

// TODO(gkm): Implement pagination.
app.get("/problems", async (req, res) => {
    res.send((await pool.query("SELECT id, name from problems")).rows);
});

app.route("/problems/:id")
    .get(async (req, res) => {
        const problem = (await pool.query("SELECT * from problems WHERE id = $1", [req.params["id"]])).rows?.[0];
        
        if (typeof problem === "undefined") {
            res.sendStatus(404 /* Not found */)
            return;
        }

        res.send(problem);
    })
    .post(bodyValues("code", "language"), async (req, res) => {
        await pool.query("INSERT INTO submissions (code, language) VALUES ($1, $2)", [req.body["code"], req.body["language"]]);
        res.sendStatus(201 /* Created */);
    });

// TODO(gkm): Get the current users submissions instead of all submissions.
app.get("/submissions", async (req, res) => {
    res.send((await pool.query("SELECT * from submissions")).rows);
})

app.listen(8080);