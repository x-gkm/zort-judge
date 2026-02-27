CREATE TABLE problems (
    id SERIAL PRIMARY KEY,
    contest_id INTEGER REFERENCES contests(id),
    problem_statement VARCHAR NOT NULL
);
