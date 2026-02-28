# Zort Judge

## API
POST /register
- username
- email
- password

POST /login
- username
- password

GET /contests
Response:
```json
[
    {
        "id": 42,
        "name": "Grand zort contest",
    },
    {
        "id": 43,
        "name": "Beginner zort contest",
    }
]
```

GET /contests/{id}
Response:
```json
{
    "id": 42,
    "name": "Grand zort contest",
    "starts_at": "2026-02-27T12:00+03:00",
    "ends_at": "2026-02-27T13:40+03:00",
    "ongoing": true,
    "problems": [
        {
            "id": 123,
            "name": "Add two numbers"
        },
        {
            "id": 456,
            "name": "Subtract two numbers"
        }
    ]
}
```

GET /problems/{id}
Response:
```json
{
    "id": 123,
    "name": "Add two numbers",
    "problem_statement": "..."
}
```

POST /problems/{id}/
Request:
```json
{
    "language": "python3-pypy",
    "code": "import sys..."
}
```

GET /submissions
```json
[
    {
        "language": "python3-pypy",
        "code": "import sys...",
        "passed": false,
    }
]
```