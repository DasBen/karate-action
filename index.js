// index.js
const core = require('@actions/core');
const { downloadKarateJar } = require('./utils');
const fs = require('fs');
const { execSync } = require('child_process');

const DEFAULT_TEST_DIR = 'sanityTests';
const DEFAULT_TEST_FILE = 'SanityTest.feature';

// Regular expression pattern to validate URLs
const URL_PATTERN = /^(https?):\/\/[^\s/$.?#].[^\S]*$/i;

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
  if (!URL_PATTERN.test(baseUrl)) {
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
    const cmd = `java -DbaseUrl=${baseUrl} -DAuthorization=${authToken} -jar ${jarPath} ${testFile}`;
    let output;
    try {
      output = execSync(cmd, { encoding: 'utf-8', cwd: sanityTestDir });
    } catch (error) {
      core.error(`Error executing command "${cmd}": ${error.message}`);
      allPassed = false;
      break;
    }

    core.info(`Output received: ${output.toString()}`);
    if (!output?.toString().includes('failed:  0')) {
      core.info("Marking as failed due to missing pass confirmation");
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
    } catch (error) {
      core.info(`Status: FAILED`)
      core.setFailed(error.message);
    }
  })();
}
