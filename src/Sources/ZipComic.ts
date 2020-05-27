import fetch from "node-fetch";
import cheerio from "cheerio";

import { Item, Chapter, ItemInfo } from "../Util";

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

export async function info_zipcomic(id: string) {
  try {
    const { ZIPCOMIC_URL } = process.env;
    const response = await fetch(`${ZIPCOMIC_URL}/${id}`);
    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $(".img-responsive").attr("alt")!.trim();
    const image = `https://zipcomic.com/${$(".img-responsive")
      .attr("src")!
      .trim()}`;
    const chapters = new Array<Chapter>();
    $("tbody")
      .find("tr")
      .each((index, el) => {
        if (index === 0) return;
        if ($(el).children().eq(0).attr("colspan")) return;
        const id = $(el)
          .children()
          .eq(1)
          .find("a")
          .attr("href")!
          .trim()
          .substring(1);
        const title = $(el).children().eq(1).text().trim();
        chapters.push({ id, title });
      });
    const comic: ItemInfo = {
      item: { id, title },
      image,
      chapters,
    };
    return comic;
  } catch (error) {
    return error;
  }
}
