import type { Request, Response, NextFunction } from "express";

declare module 'express-serve-static-core' {
    interface Request {
        pagination: {
            limit: number,
            after: string | undefined
        }
    }
}

export function bodyValues(...values: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const missing = values.filter(value => typeof req.body?.[value] === "undefined");
        if (missing.length > 0) {
            throw new Error(`Missing body fields: ${missing.join(", ")}`);
        }
        next();
    }
}

function parseNumber(n: string): number {
    if (n === "") {
        return NaN;
    }
    return Number(n);
}

export function pagination(req: Request, res: Response, next: NextFunction) {
    let limit = parseNumber(String(req.query["limit"]).trim());

    if (isNaN(limit) || limit <= 0 || limit > 10) {
        limit = 10;
    }

    let after: string | undefined = String(req.query["after"] ?? "").trim();

    if (after === "") {
        after = undefined;
    }

    req.pagination = { limit, after };
    next()
}

export function loggedIn(req: Request, res: Response, next: NextFunction) {
    if (req.session?.username == null) {
        res.sendStatus(401 /* Unauthorized */);
        return;
    }

    next()
}