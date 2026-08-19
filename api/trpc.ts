import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers";
import { validateSession } from "../server/_core/auth";
import { SESSION_COOKIE } from "../shared/const";
import { parse as parseCookieHeader } from "cookie";

async function createFetchContext({ req, resHeaders }: { req: Request; resHeaders: Headers }) {
  let user = null;
  try {
    const cookies = parseCookieHeader(req.headers.get("cookie") ?? "");
    const sessionId = cookies[SESSION_COOKIE];
    if (sessionId) {
      const result = await validateSession(sessionId);
      user = result?.user ?? null;
    }
  } catch {
    user = null;
  }
  return { req, res: resHeaders, user } as any;
}

function normalizeRequest(request: Request) {
  const url = new URL(request.url);
  const trpcPath = url.searchParams.get("trpcPath");
  if (!trpcPath) return request;
  url.searchParams.delete("trpcPath");
  url.pathname = `/api/trpc/${trpcPath}`;
  return new Request(url, request);
}

export default async function handler(request: Request) {
  const normalizedRequest = normalizeRequest(request);
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: normalizedRequest,
    router: appRouter,
    createContext: createFetchContext,
    responseMeta({ ctx }) {
      return { headers: ctx?.res instanceof Headers ? ctx.res : undefined };
    },
  });
}
