CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    problem_id INTEGER REFERENCES problems(id),
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    code VARCHAR NOT NULL,
    language VARCHAR NOT NULL
);
