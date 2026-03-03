import "dotenv/config";
import express from "express";
import { pool } from "./db.js";
import auth from "./auth.js"
import { bodyValues, pagination  } from "./middleware.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(auth)

app.get("/contests", pagination, async (req, res) => {
    res.send((await pool.query("SELECT id, name FROM contests WHERE id > $1 ORDER BY id LIMIT $2", [req.pagination.after ?? -1, req.pagination.limit])).rows);
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

app.get("/problems", pagination, async (req, res) => {
    res.send((await pool.query("SELECT id, name from problems WHERE id > $1 ORDER BY id LIMIT $2", [req.pagination.after, req.pagination.limit])).rows);
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