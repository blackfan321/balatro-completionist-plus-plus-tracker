{
  perSystem =
    { config, pkgs, ... }:
    {
      devShells.default = pkgs.mkShell {
        inherit (config.checks.prek) shellHook;
        packages = [
          pkgs.just
          pkgs.miniserve
          (pkgs.writeShellScriptBin "serve" ''
            exec ${pkgs.miniserve}/bin/miniserve \
              --index index.html \
              --port 8087 \
              .
          '')
        ]
        ++ config.checks.prek.enabledPackages;
      };
    };
}
