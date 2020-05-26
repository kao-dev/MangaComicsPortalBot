import fetch from "node-fetch";

import { Item } from "../Util";

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
