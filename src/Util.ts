export const Sources = ["Manga Eden [EN]", "Manga Eden [IT]", "ZipComics [EN]"];

export interface Item {
  id: string;
  title: string;
}

export interface ItemInfo {
  item: Item;
  image: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  title: string;
}
