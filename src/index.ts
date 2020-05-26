import Telegraf from "telegraf";
import express from "express";

import { CallbackButton } from "telegraf/typings/markup";

import { Sources, Item } from "./Util";
import { search_mangaeden } from "./Sources/MangaEden";
import { search_zipcomic } from "./Sources/ZipComic";

// ### Setup

const { NODE_ENV } = process.env;

if (NODE_ENV !== "production") require("dotenv").config();

const { PORT, TELEGRAM_TOKEN, URL, MANGAEDEN_URL, ZIPCOMIC_URL } = process.env;

if (
  !TELEGRAM_TOKEN ||
  !MANGAEDEN_URL ||
  !ZIPCOMIC_URL ||
  (NODE_ENV === "production" && !URL)
)
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

Bot.on("callback_query", async (ctx) => {
  ctx.deleteMessage();
  const data = ctx.callbackQuery!.data!.split(/search:(.+):(.+)/);
  const source = Number(data[1]);
  const text = data[2];
  let items = new Array<Item>();
  try {
    switch (source) {
      case 0: // Manga Eden EN
      case 1: // Manga Eden IT
        items = await search_mangaeden(source, text);
        break;
      case 2: // ZipComic
        items = await search_zipcomic(text);
        break;
    }
  } catch (error) {
    ctx.reply(`There was an error: ${error}`);
  }
  if (items.length === 0) {
    ctx.reply(`I couldn't find any items on ${Sources[source]}`);
    return;
  }
  if (items.length > 8) items.length = 8;

  const inline_keyboard: CallbackButton[][] = items.map((i) => [
    {
      text: i.title,
      callback_data: `info:${source}:${i.id}`,
      hide: false,
    },
  ]);

  ctx.reply(`Here's what I found on ${Sources[source]}`, {
    reply_markup: { inline_keyboard },
  });

  ctx.answerCbQuery();
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
