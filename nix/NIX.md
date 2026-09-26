# Nix

Requires [Nix](https://nixos.org/download/) with flakes enabled.

## Quick Start

**Install into your profile:**

```bash
nix profile install github:blackfan321/balatro-completionist-plus-plus-tracker
```

**Try it without installing:**

```bash
nix run github:blackfan321/balatro-completionist-plus-plus-tracker
```

## Installation

### NixOS Flake

```nix
{
  inputs = {
    nixpkgs = {
      url = "github:nixos/nixpkgs/nixos-unstable";
    };
    balatro-completionist-plus-plus-tracker = {
      url = "github:blackfan321/balatro-completionist-plus-plus-tracker";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { nixpkgs, balatro-completionist-plus-plus-tracker, ... }: {
    nixosConfigurations.hostname = nixpkgs.lib.nixosSystem {
      modules = [{ pkgs, ... }: {
        environment.systemPackages = [
          balatro-completionist-plus-plus-tracker.packages.${pkgs.stdenv.hostPlatform.system}.default
        ];
      }];
    };
  };
}
```

### Home Manager

```nix
{ inputs, pkgs, ... }:
{
  home.packages = [
    inputs.balatro-completionist-plus-plus-tracker.packages.${pkgs.stdenv.hostPlatform.system}.default
  ];
}
```

## Usage

```bash
balatro-completionist-plus-plus-tracker
```

Or in the background:

```bash
balatro-completionist-plus-plus-tracker &
```

Open http://localhost:8087 in your browser. 
Change the port if you want to: `PORT=9090 balatro-completionist-plus-plus-tracker`

## Direnv

Allow [direnv](https://direnv.net/) to activate the flake devshell:

```bash
direnv allow
```

You also need [nix-direnv](https://github.com/nix-community/nix-direnv). The shell provides `just`, `miniserve`, the `serve` helper, and pre-commit hooks (`nixfmt`, `deadnix`, `statix`).

Or enter the shell directly:

```bash
nix develop
```

## Development

Enter the devshell and serve the working tree: edits to `index.html` / `static/` show up automatically:

```bash
nix develop
serve
```

## Just

### Development
| Command | Description |
| --- | --- |
| `just serve` | Start live static server on port `8087` |
| `just build` | Build the default package |
| `just check` | Run flake checks |

### Pre-commit (prek)
| Command | Description |
| --- | --- |
| `just prek-install` | Installs the pre-commit hook |
| `just prek-uninstall` | Removes the pre-commit hook |
| `just prek-run` | Runs all checks against all repo files |
