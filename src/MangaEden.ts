import fetch from "node-fetch";

import { TelegrafContext } from "telegraf/typings/context";
import { CallbackButton } from "telegraf/typings/markup";

import { Sources } from "./Util";

export interface MangaInfo {
  id: string;
  title: string;
  hits: number;
}

export async function search_mangaeden(
  ctx: TelegrafContext,
  lang: number,
  text: string
) {
  try {
    const { MANGAEDEN_URL } = process.env;
    const response = await fetch(`${MANGAEDEN_URL}/api/list/${lang}`);
    const json = await response.json();
    const mangas: MangaInfo[] = json.manga
      .filter((m: any) => m.ld)
      .filter((m: any) => m.t.toLowerCase().includes(text.toLowerCase()))
      .sort((m: any) => m.h)
      .map((m: any) => ({
        id: m.i,
        title: m.t,
        hits: m.h,
      }));
    if (mangas.length === 0) {
      ctx.reply(`I couldn't find any mangas on ${Sources[lang]}`);
      return;
    }
    if (mangas.length > 8) mangas.length = 8;
    const inline_keyboard: CallbackButton[][] = mangas.map((m) => [
      {
        text: m.title,
        callback_data: `info:${lang}:${m.id}`,
        hide: false,
      },
    ]);

    ctx.reply(`Here's what I found on ${Sources[lang]}`, {
      reply_markup: { inline_keyboard },
    });
  } catch (error) {
    ctx.reply(error);
  }
}
