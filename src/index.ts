import Telegraf from "telegraf";
import express from "express";

import { CallbackButton } from "telegraf/typings/markup";
import { TelegrafContext } from "telegraf/typings/context";

import { Sources, Item, ItemInfo } from "./Util";
import {
  search_mangaeden,
  info_mangaeden,
  chapter_mangaeden,
} from "./Sources/MangaEden";
import {
  search_zipcomic,
  info_zipcomic,
  chapter_zipcomic,
} from "./Sources/ZipComic";

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
      callback_data: `search:${index}:${ctx.message!.text!}:0`,
      hide: false,
    },
  ]);

  ctx.reply("Where do you want to search?", {
    reply_markup: { inline_keyboard },
  });
});

Bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery!.data!.split(/(.+):(.+):(.+):(.+)/);
  const step = data[1];
  const source = Number(data[2]);
  const text = data[3];
  const offset = Number(data[4]);
  switch (step) {
    case "search":
      ctx.deleteMessage();
      search(ctx, source, text);
      break;
    case "info":
      ctx.deleteMessage();
      info(ctx, source, text, offset);
      break;
    case "chapter":
      chapter(ctx, source, text);
      break;
    default:
      ctx.deleteMessage();
      ctx.replyWithMarkdown(`Error: Unrecognized step: \`${step}\``);
      break;
  }

  ctx.answerCbQuery();
});

async function search(ctx: TelegrafContext, source: number, text: string) {
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
      callback_data: `info:${source}:${i.id}:0`,
      hide: false,
    },
  ]);

  ctx.reply(`Here's what I found on ${Sources[source]}`, {
    reply_markup: { inline_keyboard },
  });
}

async function info(
  ctx: TelegrafContext,
  source: number,
  id: string,
  offset: number
) {
  let info: ItemInfo;
  try {
    switch (source) {
      case 0: // Manga Eden EN
      case 1: // Manga Eden IT
        info = await info_mangaeden(id);
        break;
      case 2: // ZipComic
        info = await info_zipcomic(id);
        break;
    }
  } catch (error) {
    ctx.reply(`There was an error: ${error}`);
  }

  const inline_keyboard = new Array<Array<CallbackButton>>();
  const max = 50;
  const length = info!.chapters.length - offset * max;
  if (length <= max) {
    for (let index = offset * max; index < info!.chapters.length; index++) {
      inline_keyboard.push([
        {
          text: `${info!.chapters[index].title}`,
          callback_data: `chapter:${source}:${info!.chapters[index].title}:0`,
          hide: false,
        },
      ]);
    }
    inline_keyboard.push([
      {
        text: "<",
        callback_data: `info:${source}:${id}:${offset === 0 ? 0 : offset - 1}`,
        hide: false,
      },
    ]);
  } else {
    for (let index = offset * max; index < max + offset * max; index++) {
      if (info!.chapters[index]) {
        inline_keyboard.push([
          {
            text: `${info!.chapters[index].title}`,
            callback_data: `chapter:${source}:${info!.chapters[index].id}:0`,
            hide: false,
          },
        ]);
      }
    }
    inline_keyboard.push([
      {
        text: "<",
        callback_data: `info:${source}:${id}:${offset === 0 ? 0 : offset - 1}`,
        hide: false,
      },
      {
        text: ">",
        callback_data: `info:${source}:${id}:${offset + 1}`,
        hide: false,
      },
    ]);
  }

  ctx.replyWithPhoto(info!.image, {
    caption: info!.item.title,
    reply_markup: { inline_keyboard },
  });
}

async function chapter(ctx: TelegrafContext, source: number, id: string) {
  let images = new Array<string>();
  try {
    switch (source) {
      case 0: // Manga Eden EN
      case 1: // Manga Eden IT
        images = await chapter_mangaeden(id);
        break;
      case 2: // ZipComic
        images = await chapter_zipcomic(id);
        break;
    }
  } catch (error) {
    ctx.reply(`There was an error: ${error}`);
  }

  ctx.reply("Sending chapter...");
  sendPhotos(ctx, images, 0, ctx.callbackQuery!.from.id);
}

async function sendPhotos(
  ctx: TelegrafContext,
  images: string[],
  index: number,
  id: number
) {
  if (images[index]) {
    return setTimeout(async () => {
      await ctx.telegram.sendPhoto(id, images[index], {
        caption: (index + 1).toString(),
        disable_notification: true,
      });
      sendPhotos(ctx, images, ++index, id);
    }, 500);
  } else {
    return ctx.reply("Chapter sent");
  }
}

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
