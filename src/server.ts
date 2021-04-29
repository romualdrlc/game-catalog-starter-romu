import express, { Request, Response } from "express";
import * as core from "express-serve-static-core";
import { MongoClient } from "mongodb";
import nunjucks from "nunjucks";
import session from "express-session";
import MongoStore from "connect-mongo";
import OAuth2Client, {
  OAuth2ClientConstructor,
} from "@fewlines/connect-client";
import { Game, GameModel } from "./models/game";

const clientWantsJson = (request: express.Request): boolean =>
  request.get("accept") === "application/json";

export function makeApp(client: MongoClient): core.Express {
  const app = express();
  const db = client.db();

  const gameModel = new GameModel(db.collection("games"));

  const oauthClientConstructorProps: OAuth2ClientConstructor = {
    openIDConfigurationURL:
      "https://fewlines.connect.prod.fewlines.tech/.well-known/openid-configuration",
    clientID: `${process.env.CONNECT_CLIENT_ID}`,
    clientSecret: `${process.env.CONNECT_CLIENT_SECRET}`,
    redirectURI: `${process.env.CONNECT_REDIRECT_URI}`,
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
    try {
      const url = await oauthClient.getAuthorizationURL();
      let loggedIn = false;
      if (request.session && (request.session as any)["accessToken"]) {
        loggedIn = true;
      }
      response.render("home", {
        connectLoginURL: url,
        loggedIn: loggedIn,
      });
    } catch (error) {
      console.log(error);
    }
  });

  app.get("/games", (request, response) => {
    gameModel.getAll().then((games) => {
      if (clientWantsJson(request)) {
        response.json(games);
      } else {
        response.render("games", { games });
      }
    });
  });
  const cart: Game[] = [];
  app.get("/games/:game_slug", (request, response) => {
    gameModel.findBySlug(request.params.game_slug).then((game) => {
      if (!game) {
        response.status(404).end();
      } else if (clientWantsJson(request)) {
        response.json(game);
      } else {
        cart.push(game);

        console.log(test);
        response.render("game-slug", { game });
      }
    });
  });

  app.get("/cart", (request, response) => {
    response.render("cart", { cart });
  });

  app.get("/platforms", (request, response) => {
    gameModel.getPlatforms().then((platforms) => {
      if (clientWantsJson(request)) {
        response.json(platforms);
      } else {
        response.render("platforms", { platforms });
      }
    });
  });

  app.get("/platforms/:platform_slug", (request, response) => {
    gameModel
      .findByPlatform(request.params.platform_slug)
      .then((gamesForPlatform) => {
        if (clientWantsJson(request)) {
          response.json(gamesForPlatform);
        } else {
          response.render("platform-slug", { gamesForPlatform });
        }
      });
  });

  app.get(
    "/oauth/callback",
    sessionParser,
    (request: Request, response: Response) => {
      oauthClient
        .getTokensFromAuthorizationCode(`${request.query.code}`)
        .then((result) => {
          oauthClient.verifyJWT(result.access_token, "RS256").then((test) => {
            console.log(test);
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
