#!/bin/bash -ex

# Build and tag docker image
docker build -t "ffa:$TRAVIS_BRANCH" .
docker tag "ffa:$TRAVIS_BRANCH" "$REPO_URI:$TRAVIS_BRANCH"
docker tag "ffa:$TRAVIS_BRANCH" "$REPO_URI:$TRAVIS_BUILD_NUMBER"
$(aws ecr get-login --no-include-email --region $AWS_DEFAULT_REGION)
echo "Pushing images as $REPO_URI:$TRAVIS_BRANCH and $REPO_URI:$TRAVIS_BUILD_NUMBER"
docker push "$REPO_URI:$TRAVIS_BRANCH"
docker push "$REPO_URI:$TRAVIS_BUILD_NUMBER"

# Force deploy service to pick up new docker image & wait for success
echo "Restarting $SERVICE to complete deployment"
docker images
python scripts/restart_service.py $CLUSTER $SERVICE
