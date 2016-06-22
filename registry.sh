# Build and Push new setlist_visualizer image to gitlab registry. Run from ~/setlist_visualizer.

# Get current Dockerfile version
string=$(grep 'setlist_visualizer:' web/Dockerfile)
regex='[0-9]+\.[0-9]$'
if [[ $string =~ $regex ]]
then
  currentVersion=${BASH_REMATCH[0]}
  echo "Current Dockerfile Version: $currentVersion"
else
  echo "Unable to get current version from web/Dockerfile. No version found in string: $string"
  exit 1
fi

# Set new version
defaultVersion=latest
read -p "Enter New Version [$defaultVersion]: " newVersion
newVersion=${newVersion:-$defaultVersion}

# Login to gitlab registry, build with new version, push to registry
echo "Please provide registry.gitlab.com credentials"
docker login registry.gitlab.com
docker build -f web/Dockerfile -t registry.gitlab.com/djo3/setlist_visualizer:$newVersion web
docker push registry.gitlab.com/djo3/setlist_visualizer

# Update Dockerfile with new version
echo "Updating web/Dockerfile to use new version number $newVersion"
sed -i '' "s/$currentVersion/$newVersion/1" web/Dockerfile
echo "Done!"
