import { type Request, type Response, type NextFunction } from "express";
import cookieSession from "cookie-session";

const session = [
    cookieSession({
        secret: process.env["COOKIE_SECRET"],
    }),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.session == null) {
            return;
        }

        req.session.nowInMinutes = Math.floor(Date.now() / 60_000)

        next()
    }
];
export default session;
