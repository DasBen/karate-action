// tests/integration.test.js
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

let tmpFilePath;

describe('GitHub Action Integration Test', () => {

  // Set up valid environment variables for the tests
  beforeAll(async () => {
    process.env.INPUT_TESTDIR = 'sanityTests';
    process.env.INPUT_TESTFILEPATH = 'SanityTest.feature';
    process.env.INPUT_KARATEVERSION = '1.4.0';
    process.env.INPUT_BASEURL = 'https://httpstat.us';
    process.env.INPUT_AUTHORIZATION = 'token123';
    process.env.GITHUB_WORKSPACE = process.cwd();

    // Ensure the .tmp directory exists
    const tmpDirPath = path.join(process.env.GITHUB_WORKSPACE, '.tmp');
    await fs.mkdir(tmpDirPath, { recursive: true });

    // Create a temporary file
    tmpFilePath = path.join(tmpDirPath, 'workspace.txt');
    await fs.writeFile(tmpFilePath, 'Temporary file content');

    // Set the env variable that will read from this tmp file
    process.env.GITHUB_STEP_SUMMARY = tmpFilePath;
  });

  // Clean up after tests
  afterAll(() => {
    delete process.env.INPUT_TESTDIR;
    delete process.env.INPUT_TESTFILEPATH;
    delete process.env.INPUT_KARATEVERSION;
    delete process.env.INPUT_BASEURL;
    delete process.env.INPUT_AUTHORIZATION;
    delete process.env.GITHUB_WORKSPACE;
  });

  const runActionAndExpectSuccess = (env) => {
    const result = execSync('node index.js', {
      env: { ...process.env, ...env },
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    expect(result).toContain('PASSED');
  };

  function runActionAndExpectFailure(envVars) {
    let thrownError = null;

    try {
      execSync(`node index.js`, { encoding: 'utf-8', env: { ...process.env, ...envVars }, stdio: 'pipe' });
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.stdout?.toString()).toContain('Status: FAILED');
  }

  // Positive Tests
  it('runs action script without errors', () => {
    runActionAndExpectSuccess({ ...process.env });
  }, 30000);

  it('runs action script without errors with multiple test files', () => {
    runActionAndExpectSuccess({ ...process.env, INPUT_TESTFILEPATH: 'SanityTest.feature,SanityTest.feature' });
  }, 30000);

  it('runs action script with missing base URL and expects success', () => {
    const { INPUT_BASEURL, ...restEnv } = process.env;
    runActionAndExpectSuccess(restEnv);
  });

  it('runs action script with missing test files and expects success', () => {
    const { INPUT_TESTFILEPATH, ...restEnv } = process.env;
    runActionAndExpectSuccess(restEnv);
  });

  it('runs action script with missing Karate version and expects success', () => {
    const { INPUT_KARATEVERSION, ...restEnv } = process.env;
    runActionAndExpectSuccess(restEnv);
  });

  // Negative Tests
  it('runs action script with error in one of multiple test files', () => {
    runActionAndExpectFailure({ INPUT_TESTFILEPATH: 'SanityTest.feature,SanityTestBad.feature' });
  }, 30000);

  it('runs action script with error in test files', () => {
    runActionAndExpectFailure({ INPUT_TESTFILEPATH: 'SanityTestBad.feature' });
  }, 30000);

  it('runs action script with invalid URL and expects failure', () => {
    runActionAndExpectFailure({ INPUT_BASEURL: 'https://invalid-url-for-test.xyz' });
  });

  it('runs action script with invalid base URL format and expects failure', () => {
    runActionAndExpectFailure({ INPUT_BASEURL: 'invalid-url' });
  });

  it('runs action script with invalid base URL and expects failure', () => {
    runActionAndExpectFailure({ INPUT_BASEURL: 'invalid_base_url' });
  });

  it('runs action script with invalid test files and expects failure', () => {
    runActionAndExpectFailure({ INPUT_TESTFILEPATH: 'invalid_file_path' });
  });

  it('runs action script with invalid Karate version and expects failure', () => {
    runActionAndExpectFailure({ INPUT_KARATEVERSION: 'invalidVersion' });
  });

  it('runs action script with invalid Karate version and expects failure', () => {
    runActionAndExpectFailure({ INPUT_KARATEVERSION: 'invalidVersion' });
  }, 30000);

});
