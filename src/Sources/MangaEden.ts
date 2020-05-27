import fetch from "node-fetch";

import { Item, Chapter, ItemInfo } from "../Util";

export async function search_mangaeden(lang: number, text: string) {
  try {
    const { MANGAEDEN_URL } = process.env;
    const response = await fetch(`${MANGAEDEN_URL}/api/list/${lang}`);
    const json = await response.json();
    const mangas: Item[] = json.manga
      .filter((m: any) => m.ld)
      .filter((m: any) => m.t.toLowerCase().includes(text.toLowerCase()))
      .sort((m: any) => m.h)
      .map((m: any) => ({
        id: m.i,
        title: m.t,
      }));
    return mangas;
  } catch (error) {
    return error;
  }
}

export async function info_mangaeden(id: string) {
  try {
    const { MANGAEDEN_URL } = process.env;
    const response = await fetch(`${MANGAEDEN_URL}/api/manga/${id}`);
    const json = await response.json();
    const chapters: Chapter[] = json.chapters.map((c: any[]) => ({
      id: c[3],
      title: `${c[0]} - ${c[2]}`,
    }));
    const manga: ItemInfo = {
      item: {
        id,
        title: `${json.title} | Author: ${json.author} | Artist: ${json.artist}`,
      },
      image: `https://cdn.mangaeden.com/mangasimg/${json.image}`,
      chapters,
    };
    return manga;
  } catch (error) {
    return error;
  }
}

export async function chapter_mangaeden(id: string) {
  try {
    const { MANGAEDEN_URL } = process.env;
    const response = await fetch(`${MANGAEDEN_URL}/api/chapter/${id}`);
    const json = await response.json();
    const images = json.images
      .map((i: any[]) => `https://cdn.mangaeden.com/mangasimg/${i[1]}`)
      .reverse();
    return images;
  } catch (error) {
    return error;
  }
}
