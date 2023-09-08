// test-report.js
const fs = require('fs');
const path = require('path');
const core = require('@actions/core');
const { generateTestSummary } = require('../report');

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    access: jest.fn(),
  },
}));

jest.mock('@actions/core', () => ({
  info: jest.fn(),
  error: jest.fn(),
  summary: {
    addHeading: jest.fn().mockReturnThis(),
    addCodeBlock: jest.fn().mockReturnThis(),
    addMarkdown: jest.fn().mockReturnThis(),
    write: jest.fn().mockReturnThis(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('generateTestSummary', () => {

  it('reads the summary JSON and generates a markdown summary or core.info', async () => {
    // Similar to your existing test but adapted for new changes
    const fakeData = {
      featureSummary: [
        {
          packageQualifiedName: 'Feature 1',
          durationMillis: 1000,
          passedCount: 1,
          failedCount: 0,
        },
        {
          packageQualifiedName: 'Feature 2',
          durationMillis: 1500,
          passedCount: 0,
          failedCount: 1,
        },
      ],
    };

    fs.promises.readFile.mockResolvedValue(JSON.stringify(fakeData));

    await generateTestSummary('sanityTest');

    if (process.env.GITHUB_ACTIONS) {
      expect(core.summary.addHeading).toHaveBeenCalledWith('Test Results');
      expect(core.summary.addCodeBlock).toHaveBeenCalledWith(JSON.stringify(fakeData, null, 2), 'json');
    } else {
      expect(core.info).toHaveBeenCalled();
    }
  });

});

describe('generateTestSummary with Errors', () => {
  it('handles no content in summary file gracefully', async () => {
    const mockBaseDir = '/mock/base/dir';

    // Mock the file as existing
    fs.promises.access.mockResolvedValue();

    // Mock the file as empty but still JSON-formatted
    fs.promises.readFile.mockResolvedValue(JSON.stringify({ featureSummary: [] }));

    await generateTestSummary(mockBaseDir);

    expect(core.error).not.toHaveBeenCalled();
  });

  it('handles featureSummary not being an array', async () => {
    const mockBaseDir = '/mock/base/dir';
    fs.promises.readFile.mockResolvedValue(JSON.stringify({ featureSummary: 'notAnArray' }));
    await generateTestSummary(mockBaseDir);
    expect(core.error).toHaveBeenCalledWith('featureSummary is not an array or not found in the summary data.');
  });

  it('handles invalid summary file path gracefully', async () => {
    const mockBaseDir = '/invalid/base/dir';

    // Mock the file as not existing
    fs.promises.access.mockRejectedValue(new Error('File not found'));

    await generateTestSummary(mockBaseDir);

    expect(core.error).toHaveBeenCalledWith(`Summary file ${path.join(mockBaseDir, 'target', 'karate-reports', 'karate-summary-json.txt')} does not exist.`);
  });

});
