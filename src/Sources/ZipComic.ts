import fetch from "node-fetch";
import cheerio from "cheerio";

import { Item } from "../Util";

export async function search_zipcomic(text: string) {
  try {
    const { ZIPCOMIC_URL } = process.env;
    const response = await fetch(`${ZIPCOMIC_URL}/search?kwd=${text}`);
    const html = await response.text();
    const $ = cheerio.load(html);
    const comics = new Array<Item>();
    $("div.block-content-full")
      .eq(0)
      .find("h3")
      .each((_, el) => {
        const id = $(el).find("a").attr("href")!.replace("/", "");
        const title = $(el).text().trim();
        comics.push({ id, title });
      });
    return comics;
  } catch (error) {
    return error;
  }
}
