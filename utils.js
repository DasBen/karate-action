// utils.js
const fs = require('fs');
const axios = require('axios');
const semver = require('semver');
const path = require('path');

async function downloadKarateJar(version, sanityTestDir) {
  console.log(`Attempting to download Karate version: ${version}...`);

  const filePathWithVersion = path.join(sanityTestDir, `karate-${version}.jar`);

  // Check if the JAR version already exists
  if (fs.existsSync(filePathWithVersion)) {
    console.log(`Karate version ${version} JAR already exists at ${filePathWithVersion}. Skipping download.`);
  } else {
    // Construct the URL for the desired version
    const downloadURL = `https://github.com/karatelabs/karate/releases/download/v${version}/karate-${version}.jar`;

    let response;
    try {
      response = await axios.get(downloadURL, { responseType: 'stream' });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error(`Karate version v${version} not found.`);
        throw new Error(`Karate version v${version} not found.`);
      } else {
        console.error('Error while downloading:', error.message);
        throw error;  // If it's another kind of error, re-throw it.
      }
    }

    // Ensure directory exists
    if (!fs.existsSync(sanityTestDir)) {
      console.log(`Directory ${sanityTestDir} not found. Creating...`);
      fs.mkdirSync(sanityTestDir);
    }

    console.log(`Saving JAR to: ${filePathWithVersion}`);
    const writer = fs.createWriteStream(filePathWithVersion);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('Download complete.');
        resolve();
      });
      writer.on('error', reject);
    });
  }

  // Copy the highest version to karate.jar
  renameHighestVersion(sanityTestDir);
}

function renameHighestVersion(dir) {
  console.log('Copying the highest version JAR to karate.jar...');

  const files = fs.readdirSync(dir).filter(file => /^karate-\d+\.\d+\.\d+\.jar$/.test(file));
  const versions = files.map(file => file.match(/^karate-(\d+\.\d+\.\d+)\.jar$/)[1]);
  versions.sort(semver.rcompare); // Using semver to correctly sort versions

  if (versions.length > 0) {
    const highestVersionFile = path.join(dir, `karate-${versions[0]}.jar`);
    const genericFilePath = path.join(dir, 'karate.jar');
    if (fs.existsSync(genericFilePath)) {
      console.log(`Deleting existing karate.jar at ${genericFilePath}`);
      fs.unlinkSync(genericFilePath);
    }
    console.log(`Copying ${highestVersionFile} to ${genericFilePath}`);
    fs.copyFileSync(highestVersionFile, genericFilePath);
  } else {
    console.log('No versioned JAR files found.');
  }
}


module.exports = { downloadKarateJar, renameHighestVersion };
