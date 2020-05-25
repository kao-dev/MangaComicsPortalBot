import express from "express";

const PORT = process.env.PORT || 8080;

const App = express();

App.get("/", (_, res) =>
  res.send(
    '<a href="https://t.me/MangaComicsPortalBot">MangaComicsPortalBot</a> webpage'
  )
);

App.listen(PORT, () => console.info(`Server running on port: ${PORT}`));
