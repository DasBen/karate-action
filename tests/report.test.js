const { generateFeatureTable, generateTestSummary, getScenarioErrorDetails } = require('../report');
const fs = require('fs').promises;
const core = require('@actions/core');
const path = require('path');

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    access: jest.fn(),
  },
}));

jest.mock('@actions/core');

describe('generateFeatureTable', () => {
  it('should generate a feature table with failure', () => {
    const feature = {
      feature: 'Feature 1',
      name: 'Scenario 1',
      durationMillis: 1000,
      passedCount: 0,
      failedCount: 1,
    };
    const errorDetails = [
      {
        name: 'Test Scenario',
        error: 'Sample Error',
      },
    ];
    const result = generateFeatureTable(feature, errorDetails);
    expect(result[0].data).toBe('Feature 1');
    expect(result[1].data).toBe('Scenario 1');
    expect(result[2].data).toBe('1000');
    expect(result[3].data).toBe('0');
    expect(result[4].data).toBe('1');
    expect(result[5].data).toBe('❌');
    expect(result[6].data).toBe('Scenario: Test Scenario, Error: Sample Error');
  });

  it('should generate a feature table without failure', () => {
    const feature = {
      feature: 'Feature 1',
      name: 'Scenario 1',
      durationMillis: 1000,
      passedCount: 1,
      failedCount: 0,
    };
    const errorDetails = [];
    const result = generateFeatureTable(feature, errorDetails);
    expect(result[5].data).toBe('✅');
    expect(result[6].data).toBe('');
  });
});

describe('getScenarioErrorDetails', () => {
  it('should read file and return error details', async () => {
    const mockData = {
      scenarioResults: [
        {
          name: 'Scenario 1',
          error: 'Error 1',
          failed: true,
        },
      ],
    };
    fs.readFile.mockResolvedValue(JSON.stringify(mockData));
    const result = await getScenarioErrorDetails('qualifiedName', 'baseDir');
    expect(result).toEqual([
      {
        name: 'Scenario 1',
        error: 'Error 1',
      },
    ]);
  });

  it('should handle errors gracefully', async () => {
    fs.readFile.mockRejectedValue(new Error('File not found'));
    core.error.mockClear();
    const result = await getScenarioErrorDetails('qualifiedName', 'baseDir');
    expect(core.error).toHaveBeenCalledWith('Error reading detailed report for qualifiedName: Error: File not found');
    expect(result).toEqual([]);
  });
});

describe('generateTestSummary', () => {
  it('should generate a summary report successfully', async () => {
    const mockSummary = {
      featureSummary: [
        {
          relativePath: 'path/to/feature',
          packageQualifiedName: 'qualified.name',
          name: 'Feature 1',
          durationMillis: 1000,
          passedCount: 1,
          failedCount: 0,
        },
      ],
    };
    fs.access.mockResolvedValue(undefined);
    fs.readFile.mockResolvedValue(JSON.stringify(mockSummary));
    core.summary = {
      addHeading: jest.fn(),
      addTable: jest.fn(),
      write: jest.fn(),
    };

    await generateTestSummary('baseDir');
    expect(core.summary.addHeading).toHaveBeenCalledWith('Sanity Test Results');
    expect(core.summary.addTable).toHaveBeenCalled();
    expect(core.summary.write).toHaveBeenCalled();
  });

  it('should handle exceptions and errors', async () => {
    core.error.mockClear();
    fs.access.mockRejectedValue(new Error('File not found'));
    await generateTestSummary('baseDir');
    expect(core.error).toHaveBeenCalledWith('Summary file baseDir\\target\\karate-reports\\karate-summary-json.txt does not exist.');
  });
});
