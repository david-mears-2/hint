#!/usr/bin/env bash
set -ex

NETWORK=hint_nw
DB=hint_db
API=hintr

docker network create $NETWORK
docker pull mrcide/hint-db:latest
docker pull mrcide/hintr:latest

docker run --rm -d \
  --network=$NETWORK \
  --name $DB \
  -p 5432:5432 \
  mrcide/hint-db:latest

docker run --rm -d \
  --network=$NETWORK \
  --name=$API \
  -p 8888:8888 \
  mrcide/hintr:latest

# Need to give the database a little time to initialise before we can run the migration
sleep 10s
docker run --rm --network=$NETWORK \
  mrcide/hint-db-migrate:latest \
  -url=jdbc:postgresql://$DB/hint

HERE=$(dirname "$0")
"$HERE"/add-test-user.sh


