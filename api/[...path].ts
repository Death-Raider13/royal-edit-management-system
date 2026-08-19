import app from "../server";

export default function handler(req: any, res: any) {
    // Express apps are compatible as request handlers — forward the Vercel request to the Express app.
    return app(req, res);
}
