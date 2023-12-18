// index.js
const core = require('@actions/core');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { downloadKarateJar } = require('./utils');
const { generateTestSummary } = require('./report');
const path = require('path');
const shellQuote = require('shell-quote/quote');

const DEFAULT_TEST_DIR = 'sanityTests';
const DEFAULT_TEST_FILE = 'SanityTest.feature';
const DEFAULT_KARATE_VERSION = 'latest';
const JAR_PATH = `karate.jar`;

function getInputs() {
  // Get test directory
  const sanityTestDir =
    core.getInput('testDir', { trimWhitespace: true }) || DEFAULT_TEST_DIR;
  if (!sanityTestDir || !fs.existsSync(sanityTestDir)) {
    throw new Error(`Invalid test directory: "${sanityTestDir}"`);
  }

  // Get test file paths
  const testFiles =
    core.getInput('testFilePath', { trimWhitespace: true }) ||
    DEFAULT_TEST_FILE;
  if (!testFiles) {
    throw new Error('Test file paths not provided');
  }

  // Get Karate version
  const karateVersion =
    core.getInput('karateVersion', { trimWhitespace: true }) ||
    DEFAULT_KARATE_VERSION;
  if (!karateVersion) {
    throw new Error('Karate version not provided');
  }

  // Get auth token
  const authToken = core.getInput('authToken', { trimWhitespace: true });

  // Create and validate base URL
  const baseUrlInput = core.getInput('baseUrl', {
    trimWhitespace: true,
    required: true,
  });
  if (!baseUrlInput) {
    throw new Error('Base URL not provided');
  }
  const baseUrl = new URL(baseUrlInput);

  // Get Tags
  const tags = core.getInput('tags', { trimWhitespace: true });

  // Get Properties
  const properties = core.getInput('properties', { trimWhitespace: true });

  return {
    sanityTestDir,
    testFiles,
    karateVersion,
    authToken,
    baseUrl,
    tags,
    properties,
  };
}

function runKarate(
  baseUrl,
  authToken,
  testFiles,
  tags,
  properties,
  sanityTestDir
) {
  let allPassed = false;

  // Escape special characters in tags
  const authTokenString = shellQuote([`${authToken}`]);
  const jarPathString = shellQuote([`${JAR_PATH}`]);
  const testFilesString = shellQuote([`${testFiles}`]);
  const tagsString = shellQuote([`${tags}`]);

  // Run Karate tests
  const cmd = `java`;
  const args = [
    `-DbaseUrl=${baseUrl}`,
    `-DAuthorization=${authTokenString}`,
    `-jar`,
    `${jarPathString}`,
    `${testFilesString}`,
  ];

  if (tags) {
    args.push(`--tags`, `${tagsString}`);
  }

  if (properties) {
    const propertiesParsed = JSON.parse(properties);

    // Log keys only
    const keys = Object.keys(propertiesParsed);
    core.info(
      `Running command: ${cmd} ${args.join(' ')} with properties: ${keys.join(
        ', '
      )}`
    );

    Object.entries(propertiesParsed).forEach(([key, value]) => {
      args.push(`-D${key}=${value}`);
    });
  } else {
    core.info(`Running command: ${cmd} ${args.join(' ')}`);
  }

  const options = {
    encoding: 'utf-8',
    cwd: sanityTestDir,
    maxBuffer: 1024 * 1024,
  };

  const result = spawnSync(cmd, args, options);
  const output = result.stdout.toString();
  core.info(`Output received: ${output}`);

  // CMD throws Error or Tests are failing
  if (output.includes('failed: 0')) {
    allPassed = true;
  }

  return allPassed;
}

async function mainFunction() {
  // Get inputs
  core.info('Getting inputs...');
  const {
    sanityTestDir,
    testFiles,
    karateVersion,
    authToken,
    baseUrl,
    tags,
    properties,
  } = getInputs();

  // Download Karate JAR if it doesn't already exist
  try {
    core.info('Downloading Karate JAR...');
    await downloadKarateJar(karateVersion, sanityTestDir);
  } catch (error) {
    throw new Error(`Error downloading Karate JAR: ${error.message}`);
  }

  // Run Karate tests
  core.info(
    `Running Karate tests in "${sanityTestDir}" using version "${karateVersion}"`
  );
  let allPassed = runKarate(
    baseUrl,
    authToken,
    testFiles,
    tags,
    properties,
    sanityTestDir
  );

  // Generate test summary
  core.info('Generating test summary...');
  if (process.env.RUN_ENV !== 'local') {
    await generateTestSummary(path.join(process.cwd(), sanityTestDir));
  }

  // Return status
  return allPassed ? 'PASSED' : 'FAILED';
}

// This block will only run when this script is executed, but not when imported.
if (require.main === module) {
  (async () => {
    try {
      const status = await mainFunction();
      core.info(`Status: ${status}`);
      core.setOutput('status', status);

      if (status === 'FAILED') {
        core.setFailed('Tests failed');
        process.exit(1); // Exit with non-zero exit code to fail the GitHub Action
      }
    } catch (error) {
      core.info(`Status: FAILED`);
      core.error('Caught Error:', error);

      core.setFailed(error.message);
      process.exit(1); // Exit with non-zero exit code to fail the GitHub Action
    }
  })();
}

module.exports = { getInputs, runKarate };
