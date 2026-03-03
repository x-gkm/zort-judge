export function bodyValues(...values) {
    return (req, res, next) => {
        const missing = values.filter(value => typeof req.body?.[value] === "undefined");
        if (missing.length > 0) {
            throw new Error(`Missing body fields: ${missing.join(", ")}`);
        }
        next();
    }
}

function parseNumber(n) {
    if (n === "") {
        return NaN;
    }
    return Number(n);
}

export function pagination(req, res, next) {
    let limit = parseNumber(req.query["limit"]);

    if (isNaN(limit) || limit <= 0 || limit > 10) {
        limit = 10;
    }

    let after = String(req.query["after"] ?? "").trim();

    if (after === "") {
        after = undefined;
    }

    req.pagination = { limit, after };
    next()
}

