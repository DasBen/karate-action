// index.js
const core = require('@actions/core');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { downloadKarateJar } = require('./utils');
const { generateTestSummary } = require('./report');
const path = require('path');

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

  // Run Karate tests
  const cmd = `java`;
  const systemProperties = [
    `-DbaseUrl=${baseUrl}`,
    `-DAuthorization=${authToken}`,
  ];
  const args = [`-jar`, `${JAR_PATH}`, `${testFiles}`];

  if (tags) {
    args.push(`--tags`, tags);
  }

  if (properties) {
    const propertiesParsed = JSON.parse(properties);
    Object.entries(propertiesParsed).forEach(([key, value]) => {
      systemProperties.push(`-D${key}=${value}`);
    });
  }

  core.info(`Running karate tests`);

  const options = {
    encoding: 'utf-8',
    cwd: sanityTestDir,
    maxBuffer: 1024 * 1024,
  };

  const combinedArgs = systemProperties.concat(args);
  const result = spawnSync(cmd, combinedArgs, options);

  // Output relevant info
  core.info(`Exit code: ${result.status}`);
  process.stderr.write(result.stderr.toString());
  process.stdout.write(result.stdout.toString());

  // CMD throws Error or Tests are failing
  if (result.stdout.toString().includes('failed: 0')) {
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
