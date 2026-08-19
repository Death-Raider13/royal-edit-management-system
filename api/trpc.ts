import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();
const jsonParser = express.json({ limit: "50mb" });
const urlencodedParser = express.urlencoded({ limit: "50mb", extended: true });
app.use((req, res, next) => {
  if (req.body !== undefined) return next();
  return jsonParser(req, res, next);
});
app.use((req, res, next) => {
  if (req.body !== undefined) return next();
  return urlencodedParser(req, res, next);
});
const middleware = createExpressMiddleware({ router: appRouter, createContext });
app.use("/api/trpc", middleware);
app.use("/trpc", middleware);
app.use("/", middleware);

export default function handler(req: any, res: any) {
  const trpcPath = typeof req.query?.trpcPath === "string" ? req.query.trpcPath : undefined;
  if (trpcPath) {
    const sourceUrl = new URL(req.url ?? "/", "http://localhost");
    sourceUrl.searchParams.delete("trpcPath");
    req.url = `/api/trpc/${trpcPath}${sourceUrl.search ? sourceUrl.search : ""}`;
  }
  return app(req, res);
}
