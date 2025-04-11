#!/bin/sh
# uncomment TILE_SERVER_URL=http://satplan3d-nginx in .env.local
sed -i '' 's|TILE_SERVER_URL=http://localhost:8080|#TILE_SERVER_URL=http://localhost:8080|' .env.local
# comment TILE_SERVER_URL=http://localhost:8080 in .env.local
sed -i '' 's|#TILE_SERVER_URL=http://satplan3d-nginx|TILE_SERVER_URL=http://satplan3d-nginx|' .env.local
# build
docker build -t satplan3d-web .

# comment TILE_SERVER_URL=http://satplan3d-nginx in .env.local
sed -i '' 's|TILE_SERVER_URL=http://satplan3d-nginx|#TILE_SERVER_URL=http://satplan3d-nginx|' .env.local
# uncomment TILE_SERVER_URL=http://localhost:8080 in .env.local
sed -i '' 's|#TILE_SERVER_URL=http://localhost:8080|TILE_SERVER_URL=http://localhost:8080|' .env.local