import Telegraf from "telegraf";
import express from "express";

const { NODE_ENV } = process.env;

if (NODE_ENV !== "production") require("dotenv").config();

const { PORT, TELEGRAM_TOKEN, URL } = process.env;

if (!TELEGRAM_TOKEN || (NODE_ENV === "production" && !URL))
  throw new Error("Environment variables can't be null");

const Bot = new Telegraf(TELEGRAM_TOKEN);
const App = express();

Bot.start((ctx) => ctx.reply("MangaComicsPortalBot"));

if (NODE_ENV !== "production") {
  console.info("Development environment");
  Bot.startPolling();
} else {
  console.info("Production environment");
  Bot.telegram.setWebhook(`${URL}/bot${TELEGRAM_TOKEN}`);
  App.use(Bot.webhookCallback(`/bot${TELEGRAM_TOKEN}`));
}

App.get("/", (_, res) =>
  res.send(
    '<a href="https://t.me/MangaComicsPortalBot">MangaComicsPortalBot</a> webpage'
  )
);

App.listen(PORT || 8080, () =>
  console.info(`Server running on port: ${PORT || 8080}`)
);
