{
  description = "A task tracker focused on productivity";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      nixpkgs,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };

        launch-app = pkgs.writeShellApplication {
          name = "launch-app";
          runtimeInputs = with pkgs; [ python3 ];
          text = ''
            #!/usr/bin/env sh
            echo "Starting local web server"
            cd src && python3 -m http.server 3000
          '';
        };
      in
      {
        devShells.default =
          with pkgs;
          mkShell {
            buildInputs = [
              nodejs_26
            ];
            packages = [
              launch-app
            ];
          };
      }
    );
}
