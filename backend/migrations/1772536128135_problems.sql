-- Up Migration
CREATE TABLE problems (
    id SERIAL PRIMARY KEY,
    contest_id INTEGER REFERENCES contests(id),
    name VARCHAR NOT NULL,
    problem_statement VARCHAR NOT NULL
);

-- Down Migration
DROP TABLE problems;