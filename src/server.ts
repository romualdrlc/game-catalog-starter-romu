import express, { Request, Response } from "express";
import * as core from "express-serve-static-core";
import { Db } from "mongodb";
import nunjucks from "nunjucks";
import session from "express-session";
import MongoStore from "connect-mongo";
import OAuth2Client, {
  OAuth2ClientConstructor,
} from "@fewlines/connect-client";

const oauthClientConstructorProps: OAuth2ClientConstructor = {
  openIDConfigurationURL:
    "https://fewlines.connect.prod.fewlines.tech/.well-known/openid-configuration",
  clientID: `${process.env.CONNECT_CLIENT_ID}`,
  clientSecret: `${process.env.CONNECT_CLIENT_SECRET}`,
  redirectURI: "https://localhost:3000/oauth/callback",
  audience: "wdb2g3",
  scopes: ["openid", "email"],
};

const oauthClient = new OAuth2Client(oauthClientConstructorProps);

export function makeApp(db: Db): core.Express {
  const app = express();

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

  app.get("/", sessionParser, (request: Request, response: Response) => {
    const url = `https://localhost:3000/oauth/authorize?client_id=${clientID}&redirect_uri=${redirectURI}&response_type=code&scope=${scopes}`;
    response.render("index", {
      connectLoginURL: url,
    });
  });

  app.get(
    "/oauth/callback",
    sessionParser,
    (request: Request, response: Response) => {
      oauthClient
        .getTokensFromAuthorizationCode(`${request.query.code}`)
        .then((result) => {
          console.log(result);
          oauthClient
            .verifyJWT(result.access_token, "RS256")
            .then((payload) => {
              response.json(payload);
            });
        });
    }
  );

  return app;
}
