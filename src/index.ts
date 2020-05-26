import Telegraf from "telegraf";
import express from "express";

import { CallbackButton } from "telegraf/typings/markup";

import { search_mangaeden } from "./MangaEden";
import { Sources } from "./Util";

// ### Setup

const { NODE_ENV } = process.env;

if (NODE_ENV !== "production") require("dotenv").config();

const { PORT, TELEGRAM_TOKEN, URL, MANGAEDEN_URL } = process.env;

if (!TELEGRAM_TOKEN || !MANGAEDEN_URL || (NODE_ENV === "production" && !URL))
  throw new Error("Environment variables can't be null");

const Bot = new Telegraf(TELEGRAM_TOKEN);
const App = express();

// ### Bot

Bot.start((ctx) => ctx.reply("MangaComicsPortalBot"));

Bot.on("text", async (ctx) => {
  const inline_keyboard: CallbackButton[][] = Sources.map((s, index) => [
    {
      text: s,
      callback_data: `search:${index}:${ctx.message!.text!}`,
      hide: false,
    },
  ]);

  ctx.reply("Where do you want to search?", {
    reply_markup: { inline_keyboard },
  });
});

Bot.on("callback_query", (ctx) => {
  ctx.deleteMessage();
  const data = ctx.callbackQuery!.data!.split(/search:(.+):(.+)/);
  const source = Number(data[1]);
  const text = data[2];
  switch (source) {
    case 0: // Manga Eden EN
    case 1: // Manga Eden IT
      search_mangaeden(ctx, source, text);
      break;
    case 2: // American Comics
      ctx.reply("American Comics not implemented");
      break;
  }
  return ctx.answerCbQuery();
});

// ### Running

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
