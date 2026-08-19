import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const middleware = createExpressMiddleware({ router: appRouter, createContext });
app.use("/api/trpc", middleware);
app.use("/trpc", middleware);
app.use("/", middleware);

export default app;
