#!/bin/bash

# Test URL
URL=$1

# Optional test suite argument
SUITE=$2

echo "====================================================================="
echo "Running E2E tests"
echo "====================================================================="

echo "Test suite: $SUITE"
echo "Test URL  : $URL"

DIRPATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIRPATH/../../.."

# See if we can get the Google Chrome version and use it if we can to install the specific chrome driver version
WEBDRIVER_ARG=""
google-chrome --version
if [ $? -eq 0 ]; then
  CHROME_VERSION=$(google-chrome --version | grep -iEo "[0-9.]{10,20}")
  WEBDRIVER_ARG="--no-webdriver-update"
  echo "Updating web driver - chrome version ${CHROME_VERSION}"
  npm run update-webdriver -- --versions.chrome=${CHROME_VERSION}
fi

export E2E_REPORT_FOLDER=./e2e-reports
export DISPLAY=:99.0
mkdir -p "${E2E_REPORT_FOLDER}"
echo "Starting ffmpeg to capture screen as video"
ffmpeg -video_size 1366x768 -framerate 25 -f x11grab -draw_mouse 0 -i :99.0 "${E2E_REPORT_FOLDER}/ScreenCapture.mp4" > "${E2E_REPORT_FOLDER}/ffmpeg.log" 2>&1 &
FFMPEG=$!

export STRATOS_E2E_LOG_TIME=true
./node_modules/.bin/ng e2e ${WEBDRIVER_ARG} --dev-server-target= --base-url=${URL} ${SUITE}
RESULT=$?

echo "Stopping video capture"
kill -INT $FFMPEG
sleep 10

exit $RESULT
