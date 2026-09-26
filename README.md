# Balatro Completionist++ Tracker

![Version](https://img.shields.io/badge/version-2.1.0-blue)

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

### Where to find your `profile.jkr`?

1. Open the [save game data location](https://www.pcgamingwiki.com/wiki/Balatro#Save_game_data_location) for your platform.
2. Enter the profile folder (`1`, `2`, or `3`).
3. Select `profile.jkr` and upload it.

## Docker / Podman

1. Clone and enter the repo:

```sh
git clone https://github.com/blackfan321/balatro-completionist-plus-plus-tracker.git
cd balatro-completionist-plus-plus-tracker
```

2. Build an image and start the container:

```sh
docker compose up -d --build
# podman compose up -d --build
```

3. Open http://localhost:8087 in your browser.

## Nix / NixOS

See [NIX.md](./nix/NIX.md).

## Plans

- Add i18n support.
- Add option to turn off the shaders.
- Add auto-reload docker image support.
- Publish artifacts to GHCR.
- Add development guide for non-nix users.
- Add HTML/CSS/JS linter/prettier.
