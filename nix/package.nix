{
  stdenv,
  writeShellApplication,
  miniserve,
  src,
}:
let
  webroot = stdenv.mkDerivation {
    pname = "balatro-completionist-plus-plus-tracker-webroot";
    version = "2.1.0";
    inherit src;

    dontBuild = true;

    installPhase = ''
      runHook preInstall
      mkdir -p $out
      cp index.html $out/
      cp -r static $out/
      runHook postInstall
    '';
  };
in
writeShellApplication {
  name = "balatro-completionist-plus-plus-tracker";
  runtimeInputs = [ miniserve ];
  text = ''
    exec miniserve \
      --index index.html \
      --port "''${PORT:-8087}" \
      ${webroot}
  '';
}
