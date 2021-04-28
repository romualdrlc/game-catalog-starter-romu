import { makeApp } from "./server";
import * as dotenv from "dotenv";
import { initDB } from "./init-database";
import { GameModel } from "./models/game";
import { MongoClient } from "mongodb";

dotenv.config();

const PORT = process.env.PORT || 3000;

initDB().then((client) => {
  const app = makeApp(client);

  app.listen(PORT, () => {
    console.log(`Server successfully started on http://localhost:${PORT}`);
  });
});
