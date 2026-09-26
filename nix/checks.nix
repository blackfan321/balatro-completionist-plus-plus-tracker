{ inputs, ... }:
{
  perSystem =
    { pkgs, system, ... }:
    let
      prek = inputs.git-hooks.lib.${system}.run {
        src = inputs.self;
        package = pkgs.prek;
        hooks = {
          nixfmt.enable = true;
          nixfmt.priority = 1;

          deadnix.enable = true;
          deadnix.priority = 2;

          statix.enable = true;
          statix.priority = 3;
        };
      };
    in
    {
      checks.prek = prek;
    };
}
