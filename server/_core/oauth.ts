import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import crypto from "crypto";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Login route initiates the flow, generating the state and setting the cookie
  app.get("/api/oauth/login", (req: Request, res: Response) => {
    const state = crypto.randomBytes(32).toString("hex");
    const cookieOptions = getSessionCookieOptions(req);

    // Set state in a secure, HTTP-only cookie
    res.cookie("oauth_state", state, {
      ...cookieOptions,
      maxAge: 10 * 60 * 1000, // 10 minutes
      httpOnly: true,
      secure: true,
    });

    // Redirect to OAuth provider with state
    const redirectUri = `${req.protocol}://${req.get("host")}/api/oauth/callback`;
    const oauthUrl = new URL(`${process.env.OAUTH_SERVER_URL}/app-auth`);
    oauthUrl.searchParams.set("appId", process.env.APP_ID || "");
    oauthUrl.searchParams.set("redirectUri", redirectUri);
    oauthUrl.searchParams.set("state", state);
    oauthUrl.searchParams.set("type", "signIn");

    res.redirect(302, oauthUrl.toString());
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const storedState = req.cookies?.oauth_state;

    // Validate state (CSRF protection)
    if (!code || !state || !storedState || state !== storedState) {
      res.status(400).json({ error: "Invalid state or code" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // Clear state cookie
      res.clearCookie("oauth_state", cookieOptions);

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
