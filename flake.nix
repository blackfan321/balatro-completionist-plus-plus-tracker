{
  description = "Flake for Balatro Completionist++ Tracker";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    git-hooks = {
      url = "github:cachix/git-hooks.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [
        ./nix/checks.nix
        ./nix/devshell.nix
      ];

      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
        "x86_64-darwin"
      ];

      perSystem =
        { pkgs, ... }:
        let
          balatro-completionist-plus-plus-tracker = pkgs.callPackage ./nix/package.nix {
            src = ./.;
          };
        in
        {
          packages = {
            inherit balatro-completionist-plus-plus-tracker;
            default = balatro-completionist-plus-plus-tracker;
          };

          apps.default = {
            type = "app";
            program = "${balatro-completionist-plus-plus-tracker}/bin/balatro-completionist-plus-plus-tracker";
          };
        };
    };
}
