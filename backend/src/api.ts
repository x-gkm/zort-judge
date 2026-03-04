import express from "express";
import { bodyValues, loggedIn, pagination } from "./middleware.js";
import { pool } from "./db.js";

const router = express.Router();
export default router;

router.get("/contests", pagination, async (req, res) => {
    const { limit, after } = req.pagination;
    const query = after !== undefined
        ? "SELECT id, name FROM contests WHERE id > $2 ORDER BY id LIMIT $1"
        : "SELECT id, name FROM contests ORDER BY id LIMIT $1";

    const { rows } = await pool.query(query, [limit, after]);

    res.send(rows);
});

router.get("/contests/:id", async (req, res) => {
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

router.get("/problems", pagination, async (req, res) => {
    const { limit, after } = req.pagination;
    const query = after !== undefined
        ? "SELECT id, name from problems WHERE id > $2 ORDER BY id LIMIT $1"
        : "SELECT id, name from problems ORDER BY id LIMIT $1";

    const { rows } = await pool.query(query, [limit, after]);

    res.send(rows);
});

router.route("/problems/:id")
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

router.get("/submissions", loggedIn, pagination, async (req, res) => {
    // FIXME(gkm): Store the user id in the session as well and get rid of this query.
    const id = (await pool.query("SELECT id FROM users WHERE username = $1", [req.session!.username])).rows?.[0]?.["id"];

    const { limit, after } = req.pagination;
    const query = after !== undefined
        ? "SELECT * from submissions WHERE user_id = $1 AND id > $3 ORDER BY id LIMIT $2"
        : "SELECT * from submissions WHERE user_id = $1 ORDER BY id LIMIT $2";

    const { rows } = await pool.query(query, [id, limit, after]);

    res.send(rows);
})
