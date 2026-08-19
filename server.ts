import "dotenv/config";
import express from "express";
import path from "node:path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./server/routers";
import { createContext } from "./server/_core/context";

const app = express();
const staticRoot = path.join(process.cwd(), "dist", "public");

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
app.use(express.static(staticRoot));
app.get("*", (_request, response) => {
  response.sendFile(path.join(staticRoot, "index.html"));
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Royal Edit server listening on port ${port}`);
});

export default app;
