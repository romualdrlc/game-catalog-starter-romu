import express, { Request, Response } from "express";
import * as core from "express-serve-static-core";
import { Db, MongoClient } from "mongodb";
import nunjucks from "nunjucks";
import session from "express-session";
import MongoStore from "connect-mongo";
import OAuth2Client, {
  OAuth2ClientConstructor,
} from "@fewlines/connect-client";

export function makeApp(client: MongoClient): core.Express {
  const app = express();
  const oauthClientConstructorProps: OAuth2ClientConstructor = {
    openIDConfigurationURL:
      "https://fewlines.connect.prod.fewlines.tech/.well-known/openid-configuration",
    clientID: `${process.env.CONNECT_CLIENT_ID}`,
    clientSecret: `${process.env.CONNECT_CLIENT_SECRET}`,
    redirectURI: "http://localhost:3000/oauth/callback",
    audience: "wdb2g3",
    scopes: ["openid", "email"],
  };
  const oauthClient = new OAuth2Client(oauthClientConstructorProps);

  app.use("/assets", express.static("assets"));

  const sessionParser = session({
    secret:
      "fdiosfoihfwihfiohwipuiiufbfiuhfisheiushfpihsfpihfifhihfpuhdfshfhfpihwepihpsdhiodghfoihpfhsfphsdpifh",
    name: "sessionId",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      client: client,
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + 3600000),
    },
  });

  nunjucks.configure("views", {
    autoescape: true,
    express: app,
  });

  app.set("view engine", "njk");

  app.get("/", sessionParser, async (request: Request, response: Response) => {
    const url = await oauthClient.getAuthorizationURL();
    let loggedIn = false;
    if (request.session && (request.session as any)["accessToken"]) {
      loggedIn = true;
    }
     response.render("home", {
      connectLoginURL: url,
      loggedIn: loggedIn,
    });
  });

  app.get(
    "/oauth/callback",
    sessionParser,
    (request: Request, response: Response) => {
      oauthClient
        .getTokensFromAuthorizationCode(`${request.query.code}`)
        .then((result) => {
          oauthClient.verifyJWT(result.access_token, "RS256").then(() => {
            console.log(result.access_token);
            if (request.session) {
              (request.session as any).accessToken = result.access_token;
            }
            response.redirect("/");
          });
        });
    }
  );

  app.get("/logout", sessionParser, (request: Request, response: Response) => {
    if (request.session) {
      request.session.destroy(() => response.redirect("/"));
    } else {
      response.redirect("/");
    }
  });

  return app;
}
