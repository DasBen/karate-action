#!/bin/bash

# This script helps run GitHub Action locally

# Set inputs similar to how GitHub Actions would
export INPUT_TESTDIR="sanityTests"
export INPUT_TESTFILEPATH="SanityTest.feature"
export INPUT_KARATEVERSION="1.4.0"
export INPUT_BASEURL="https://httpstat.us"
export INPUT_AUTHORIZATION='token123'
export INPUT_TAGS=''
export RUN_ENV="local"

# Mock GitHub Workspace environment variable if needed
export GITHUB_WORKSPACE=$(pwd)

# Run the main script
node index.js

# Cleanup
unset INPUT_TESTDIR
unset INPUT_TESTFILEPATH
unset INPUT_KARATEVERSION
unset INPUT_BASEURL
unset INPUT_AUTHORIZATION
unset GITHUB_WORKSPACE
