// tests/integration.test.js
const { execSync } = require('child_process');
const { join } = require('path');
const { existsSync, unlinkSync } = require('fs');

describe('GitHub Action Integration Test', () => {

  // Set up valid environment variables for the tests
  beforeAll(() => {
    process.env.INPUT_TESTDIR = "sanityTests";
    process.env.INPUT_TESTFILEPATH = "SanityTest.feature";
    process.env.INPUT_KARATEVERSION = "1.4.0";
    process.env.INPUT_BASEURL = "https://httpstat.us";
    process.env.INPUT_AUTHORIZATION = 'token123';
    process.env.GITHUB_WORKSPACE = process.cwd();
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

  // test case with valid setup
  it('runs action script without errors', () => {
    try {
      const result = execSync(`node index.js`, { encoding: 'utf-8', env: {...process.env}, stdio: 'pipe' });
      expect(result).toContain('PASSED');
    } catch (error) {
      console.error('Command failed with:', error.message);
      console.error('Stderr:', error.stderr?.toString());
      throw error;  // Re-throwing the error to make the test fail
    }
  }, 30000);

  // test case with valid setup
  it('runs action script without errors with multiple test files', () => {
    process.env.INPUT_TESTFILEPATH = "SanityTest.feature,SanityTest.feature";
    try {
      const result = execSync(`node index.js`, { encoding: 'utf-8', env: {...process.env}, stdio: 'pipe' });
      expect(result).toContain('PASSED');
    } catch (error) {
      console.error('Command failed with:', error.message);
      console.error('Stderr:', error.stderr?.toString());
      throw error;  // Re-throwing the error to make the test fail
    }
  }, 30000);

  // test case with mixed success and error in feature files
  // it('runs action script with error in test files', () => {
  //   process.env.INPUT_TESTFILEPATH = "SanityTest.feature,SanityTestBad.feature";
  //   try {
  //     const result = execSync(`node index.js`, { encoding: 'utf-8', env: {...process.env}, stdio: 'pipe' });
  //     expect(result).toContain('FAILED');
  //   } catch (error) {
  //     console.error('Command failed with:', error.message);
  //     console.error('Stderr:', error.stderr?.toString());
  //     throw error;  // Re-throwing the error to make the test fail
  //   }
  // }, 30000);

  it('runs action script with error in test files', () => {
    process.env.INPUT_TESTFILEPATH = "SanityTest.feature,SanityTestBad.feature";
    try {
      const result = execSync(`node index.js`, { encoding: 'utf-8', env: {...process.env} });
      console.log('Command result:', result); // Log the result
      expect(result).toContain('SOME_EXPECTED_STRING'); // Adjust the expected string
    } catch (error) {
      console.error('Test failed with error:', error); // Log the entire error object
      throw error;  // Re-throwing the error to make the test fail
    }
  }, 30000);

  //
  // // test case with error in feature file
  // it('runs action script with error in test files', () => {
  //   process.env.INPUT_TESTFILEPATH = "SanityTestBad.feature";
  //   try {
  //     const result = execSync(`node index.js`, { encoding: 'utf-8', env: {...process.env}, stdio: 'pipe' });
  //     expect(result).toContain('FAILED');
  //   } catch (error) {
  //     console.error('Command failed with:', error.message);
  //     console.error('Stderr:', error.stderr?.toString());
  //     throw error;  // Re-throwing the error to make the test fail
  //   }
  // }, 30000);
  //
  // // test case with invalid URL
  // it('runs action script with invalid URL and expects failure', () => {
  //   process.env.INPUT_BASEURL = "https://invalid-url-for-test.xyz";  // Overriding the URL to be invalid
  //   try {
  //     const result = execSync(`node index.js`, { encoding: 'utf-8', env: {...process.env}, stdio: 'pipe' });
  //     expect(result).toContain('FAILED');
  //   } catch (error) {
  //     console.error('Command failed with:', error.message);
  //     console.error('Stderr:', error.stderr?.toString());
  //     throw error;  // Re-throwing the error to make the test fail
  //   }
  // });
  //
  // // test case with missing base URL
  // it('runs action script with missing base URL and expects failure', () => {
  //   delete process.env.INPUT_BASEURL;  // Removing the base URL
  //   try {
  //     const result = execSync(`node index.js`, { encoding: 'utf-8', env: {...process.env}, stdio: 'pipe' });
  //     expect(result).toContain('FAILED');
  //   } catch (error) {
  //     console.error('Command failed with:', error.message);
  //     console.error('Stderr:', error.stderr?.toString());
  //     throw error;  // Re-throwing the error to make the test fail
  //   }
  // });
  //
  // // test case with invalid base URL format
  // it('runs action script with invalid base URL format and expects failure', () => {
  //   process.env.INPUT_BASEURL = "invalid-url";  // Invalid URL format
  //   try {
  //     const result = execSync(`node index.js`, { encoding: 'utf-8', env: {...process.env}, stdio: 'pipe' });
  //     expect(result).toContain('FAILED');
  //   } catch (error) {
  //     console.error('Command failed with:', error.message);
  //     console.error('Stderr:', error.stderr?.toString());
  //     throw error;  // Re-throwing the error to make the test fail
  //   }
  // });
  //
  // // test case with missing test files
  // it('runs action script with missing test files and expects failure', () => {
  //   delete process.env.INPUT_TESTFILEPATH;  // Removing the test files
  //   try {
  //     const result = execSync(`node index.js`, { encoding: 'utf-8', env: {...process.env}, stdio: 'pipe' });
  //     expect(result).toContain('FAILED');
  //   } catch (error) {
  //     console.error('Command failed with:', error.message);
  //     console.error('Stderr:', error.stderr?.toString());
  //     throw error;  // Re-throwing the error to make the test fail
  //   }
  // });
  //
  // // test case with missing Karate version
  // it('runs action script with missing Karate version and expects failure', () => {
  //   delete process.env.INPUT_KARATEVERSION;  // Removing the Karate version
  //   try {
  //     const result = execSync(`node index.js`, { encoding: 'utf-8', env: {...process.env}, stdio: 'pipe' });
  //     expect(result).toContain('FAILED');
  //   } catch (error) {
  //     console.error('Command failed with:', error.message);
  //     console.error('Stderr:', error.stderr?.toString());
  //     throw error;  // Re-throwing the error to make the test fail
  //   }
  // });
  //
  // // test case with invalid Karate version
  // it('runs action script with invalid Karate version and expects failure', () => {
  //   process.env.INPUT_KARATEVERSION = "invalidVersion";  // Overriding the Karate version to be invalid
  //
  //   // Delete karate.jar for this specific test
  //   const jarPath = join(process.env.INPUT_TESTDIR, 'karate.jar');
  //   if (existsSync(jarPath)) {
  //     unlinkSync(jarPath);
  //   }
  //
  //   try {
  //     const result = execSync(`node index.js`, { encoding: 'utf-8', env: {...process.env}, stdio: 'pipe' });
  //     expect(result).toContain('FAILED');
  //   } catch (error) {
  //     console.error('Command failed with:', error.message);
  //     console.error('Stderr:', error.stderr?.toString());
  //     throw error;  // Re-throwing the error to make the test fail
  //   }
  // }, 30000);
});
