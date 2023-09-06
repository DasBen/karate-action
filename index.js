// index.js
const core = require('@actions/core');
const { downloadKarateJar } = require('./utils');
const fs = require('fs');
const { spawnSync } = require('child_process');

const DEFAULT_TEST_DIR = 'sanityTests';
const DEFAULT_TEST_FILE = 'SanityTest.feature';

// Regular expression pattern to validate URLs
const urlRegex = new RegExp(
  '^(https?:\\/\\/)' + // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
  '(\\#[-a-z\\d_]*)?$','i'
);

async function mainFunction() {
  const sanityTestDir = core.getInput('testDir') || DEFAULT_TEST_DIR;
  const testFiles = core.getInput('testFilePath') || DEFAULT_TEST_FILE;
  const karateVersion = core.getInput('karateVersion');
  const baseUrl = core.getInput('baseUrl');
  const authToken = core.getInput('authToken') || '';
  const jarPath = `karate.jar`;

  // Validate inputs
  if (!sanityTestDir || !fs.existsSync(sanityTestDir)) {
    core.error(`Invalid test directory: "${sanityTestDir}"`)
  }

  if (!testFiles) {
    core.error(`Test file paths not provided`);
  }

  if (!karateVersion) {
    core.error(`Karate version not provided`);
  }

  if (!baseUrl) {
    core.error(`Base URL not provided`);
  }
  if (!urlRegex.test(baseUrl)) {
    core.error(`Invalid base URL format`);
  }

  core.info(`Running Karate tests in "${sanityTestDir}" using version "${karateVersion}"`);

  // Download Karate JAR if it doesn't already exist
  try {
    await downloadKarateJar(karateVersion, sanityTestDir);
  } catch (error) {
    core.error(`Error downloading Karate JAR: ${error.message}`);
  }

  let allPassed = true;

  for (const testFile of testFiles.split(',')) {
    const cmd = `java`;
    const args = [`-DbaseUrl=${baseUrl}`, `-DAuthorization=${authToken}`, `-jar`, `${jarPath}`, `${testFile}`];

    const options = {
      encoding: 'utf-8',
      cwd: sanityTestDir,
      maxBuffer: 1024 * 1024,
    };

    const result = spawnSync(cmd, args, options);
    const output = result.stdout.toString();

    // CMD wirft Fehler
    if (result.status !== 0) {
      core.error(`Error executing command: ${cmd} ${args.join(' ')}`);
      core.info(`Output received: ${output}`);
      core.error(`Stderr: ${result.stderr.toString()}`);
      allPassed = false;

      break;
    }

    // Tests sind fehlgeschlagen
    if (!output.includes('failed:  0')) {
      core.info("Marking as failed due to missing pass confirmation");
      core.info(`Output received: ${output}`);
      allPassed = false;

      break;
    }
  }

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
      core.info(`Status: FAILED`)
      core.error("Caught Error:", error);
      core.setFailed(error.message);
      process.exit(1); // Exit with non-zero exit code to fail the GitHub Action
    }
  })();
}
