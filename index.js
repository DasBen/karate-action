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

// Regular expression pattern to validate URLs
const urlRegex = new RegExp(
  '^(https?:\\/\\/)' + // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
  '(\\#[-a-z\\d_]*)?$', 'i',
);

async function mainFunction() {
  const sanityTestDir = core.getInput('testDir', { trimWhitespace: true }) || DEFAULT_TEST_DIR;
  const testFiles = core.getInput('testFilePath', { trimWhitespace: true }) || DEFAULT_TEST_FILE;
  const karateVersion = core.getInput('karateVersion', { trimWhitespace: true }) || DEFAULT_KARATE_VERSION;
  const baseUrl = core.getInput('baseUrl', { trimWhitespace: true });
  const authToken = core.getInput('authToken', { trimWhitespace: true }) || '';
  const jarPath = `karate.jar`;

  // Validate inputs
  if (!sanityTestDir || !fs.existsSync(sanityTestDir)) {
    throw new Error(`Invalid test directory: "${sanityTestDir}"`);
  }

  if (!testFiles) {
    throw new Error('Test file paths not provided');
  }

  if (!karateVersion) {
    throw new Error('Karate version not provided');
  }

  if (!baseUrl) {
    throw new Error('Base URL not provided');
  }
  if (!urlRegex.test(baseUrl)) {
    throw new Error(`Invalid base URL format: "${baseUrl}"`);
  }

  core.info(`Running Karate tests in "${sanityTestDir}" using version "${karateVersion}"`);

  // Download Karate JAR if it doesn't already exist
  try {
    await downloadKarateJar(karateVersion, sanityTestDir);
  } catch (error) {
    throw new Error(`Error downloading Karate JAR: ${error.message}`);
  }

  let allPassed = true;

  const cmd = `java`;
  const args = [`-DbaseUrl=${baseUrl}`, `-DAuthorization=${authToken}`, `-jar`, `${jarPath}`, `${testFiles}`];

  const options = {
    encoding: 'utf-8',
    cwd: sanityTestDir,
    maxBuffer: 1024 * 1024,
  };

  const result = spawnSync(cmd, args, options);
  const output = result.stdout.toString();

  // CMD throws Error
  if (result.status !== 0) {
    core.error(`Error executing command: ${cmd} ${args.join(' ')}`);
    core.error(`Stderr: ${result.stderr.toString()}`);
    core.info(`Output received: ${output}`);
    allPassed = false;
  }

  // Tests are failing
  if (!output.includes('failed:  0')) {
    core.error('Marking as failed due to missing pass confirmation');
    core.info(`Output received: ${output}`);
    allPassed = false;
  }

  await generateTestSummary(path.join(process.cwd(), sanityTestDir));

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
