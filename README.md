# Balatro Completionist++ Tracker

## Overview

This application helps you track your progress towards the hardest Balatro achievement, **Completionist++**.

## Features

- View all the game's jokers in a grid format.
- Track which golden stickers you already have and which ones are missing.
- Add or remove a gold sticker for a specific joker.
- Search jokers by name.
- Filter jokers by rarity and sticker status.
- Sort jokers by name or rarity.
- Progress overview with totals per rarity.
- Import your game's profile to update your progress.
- No external backend; everything is handled in your browser.
- Save your progress using the browser's local storage.

## Usage

Open https://blackfan321.github.io/balatro-completionist-plus-plus-tracker, then import your game's profile.

## Docker

1. Clone the repo:

```sh
git clone https://github.com/blackfan321/balatro-completionist-plus-plus-tracker.git
cd balatro-completionist-plus-plus-tracker
```

2. Start the application using `docker-compose`:

```sh
docker compose up -d
```

3. Open http://localhost:8087 in your browser.

## Plans

- Add i18n support.
