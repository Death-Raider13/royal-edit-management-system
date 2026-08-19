import app from "../server";

export default function handler(req: any, res: any) {
    // Log basic request info for debugging in function logs
    console.log("[vercel-fn] incoming", { method: req.method, url: req.url, headers: req.headers?.host ? undefined : req.headers });

    // Forward the request to the Express app
    try {
        return app(req, res);
    } catch (err) {
        console.error("[vercel-fn] handler error:", err);
        res.statusCode = 500;
        res.end("Internal server error");
    }
}
