use std::{convert::Infallible, env};

use argon2::{
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
    password_hash::{SaltString, rand_core::OsRng},
};
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{PgPool, postgres::PgPoolOptions, query, query_as};
use warp::{
    Filter,
    http::StatusCode,
    reply::{Json, Reply, Response},
};

#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error("database error: {0}")]
    Db(#[from] sqlx::Error),
}

impl Reply for AppError {
    fn into_response(self) -> Response {
        StatusCode::INTERNAL_SERVER_ERROR.into_response()
    }
}

fn with_db(db: PgPool) -> impl Filter<Extract = (PgPool,), Error = Infallible> + Clone {
    warp::any().map(move || db.clone())
}

#[derive(Deserialize)]
struct Register {
    username: String,
    email: String,
    password: String,
}

fn hash_password(password: String) -> String {
    Argon2::default()
        .hash_password(password.as_bytes(), &SaltString::generate(&mut OsRng))
        .unwrap()
        .to_string()
}

#[derive(Deserialize)]
struct Login {
    username: String,
    password: String,
}

struct User {
    id: i32,
    username: String,
    password: String,
}

fn verify_hash(password: String, password_hash: String) -> bool {
    let parsed_hash = PasswordHash::new(&password_hash).unwrap();
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok()
}

#[derive(Serialize)]
struct ProblemListEntry {
    id: i32,
    name: String,
}

#[derive(Deserialize)]
struct CreateSubmission {
    language: String,
    code: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let _ = dotenvy::dotenv();

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&env::var("DATABASE_URL")?)
        .await?;

    let register = warp::path!("register")
        .and(warp::post())
        .and(warp::body::form())
        .and(with_db(pool.clone()))
        .then(async |form: Register, db| -> Result<StatusCode, AppError> {
            // TODO(gkm): Save the email as well.
            query!(
                "INSERT INTO users (username, password) VALUES ($1, $2)",
                form.username,
                hash_password(form.password)
            )
            .execute(&db)
            .await?;

            Ok(StatusCode::CREATED)
        });

    let login = warp::path!("login")
        .and(warp::post())
        .and(warp::body::form())
        .and(with_db(pool.clone()))
        .then(async |form: Login, db| -> Result<StatusCode, AppError> {
            let Some(user) = query_as!(
                User,
                "SELECT * FROM users WHERE username = $1",
                form.username
            )
            .fetch_optional(&db)
            .await?
            else {
                return Ok(StatusCode::UNAUTHORIZED);
            };

            if !verify_hash(form.password, user.password) {
                return Ok(StatusCode::UNAUTHORIZED);
            }

            // TODO(gkm): Return some sort of session here.
            Ok(StatusCode::OK)
        });

    // TODO(gkm): Add pagination.
    let list_contests = warp::path!("contests")
        .and(warp::get())
        .and(with_db(pool.clone()))
        .then(async |db| -> Result<Json, AppError> {
            #[derive(Serialize)]
            struct ListEntry {
                id: i32,
                name: String,
            }

            Ok(warp::reply::json(
                &query_as!(ListEntry, "SELECT id, name FROM contests ORDER BY id DESC")
                    .fetch_all(&db)
                    .await?,
            ))
        });

    let contest = warp::path!("contests" / i32)
        .and(warp::get())
        .and(with_db(pool.clone()))
        .then(async |id: i32, db| -> Result<Json, AppError> {
            struct Contest {
                id: i32,
                name: String,
                start_date: DateTime<Local>,
                end_date: DateTime<Local>,
            }

            let contest = query_as!(Contest, "SELECT * FROM contests WHERE id = $1", id)
                .fetch_one(&db)
                .await?;

            let problems = query_as!(
                ProblemListEntry,
                "SELECT id, name FROM problems WHERE contest_id = $1",
                id
            )
            .fetch_all(&db)
            .await?;

            let now = Local::now();

            Ok(warp::reply::json(&json!({
                "id": contest.id,
                "name": contest.name,
                "starts_at": contest.start_date,
                "ends_at": contest.end_date,
                "ongoing": contest.start_date <= now && now <= contest.end_date,
                "problems": problems,
            })))
        });

    // TODO(gkm): Add pagination.
    let list_problems = warp::path!("problems")
        .and(warp::get())
        .and(with_db(pool.clone()))
        .then(async |db| -> Result<Json, AppError> {
            Ok(warp::reply::json(
                &query_as!(ProblemListEntry, "SELECT id, name FROM problems")
                    .fetch_all(&db)
                    .await?,
            ))
        });

    let problem = warp::path!("problems" / i32)
        .and(warp::get())
        .and(with_db(pool.clone()))
        .then(async |id: i32, db| -> Result<Json, AppError> {
            #[derive(Serialize)]
            struct Problem {
                id: i32,
                name: String,
                problem_statement: String,
            }

            Ok(warp::reply::json(
                &query_as!(
                    Problem,
                    "SELECT id, name, problem_statement FROM problems WHERE id = $1",
                    id
                )
                .fetch_one(&db)
                .await?,
            ))
        });

    let submit = warp::path!("problems" / i32)
        .and(warp::post())
        .and(warp::body::json())
        .and(with_db(pool.clone()))
        .then(async |id: i32, submission: CreateSubmission, db| -> Result<StatusCode, AppError> {
            // FIXME(gkm): Get the current user and submit as it.
            query!("INSERT INTO submissions (user_id, problem_id, code, language) VALUES ($1, $2, $3, $4)",
                1,
                id,
                submission.code,
                submission.language,
            ).execute(&db).await?;

            Ok(StatusCode::OK)
        });

    // TODO(gkm): Add pagination.
    let list_submissions = warp::path!("submissions")
        .and(warp::get())
        .and(with_db(pool.clone()))
        .then(async |db| -> Result<Json, AppError> {
            struct Submission {
                language: String,
                code: String,
            }

            Ok(warp::reply::json(
                &query_as!(Submission, "SELECT language, code FROM submissions")
                    .fetch_all(&db)
                    .await?
                    .into_iter()
                    .map(|s| {
                        json!({
                            "language": s.language,
                            "code": s.code,
                            "passed": false, // FIXME(gkm): Implement the actual judge.
                        })
                    })
                    .collect::<Vec<_>>(),
            ))
        });

    let routes = register
        .or(login)
        .or(list_contests)
        .or(contest)
        .or(list_problems)
        .or(problem)
        .or(submit)
        .or(list_submissions);

    warp::serve(routes).run(([127, 0, 0, 1], 8080)).await;
    Ok(())
}
