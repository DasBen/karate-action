// ./report.js

const fs = require('fs').promises;
const path = require('path');
const core = require('@actions/core');

const generateFeatureTable = (feature, errorDetails) => {
  const statusIcon = feature.failedCount > 0 ? '❌' : '✅';
  const errors = errorDetails.map((error) => `Scenario: ${error.name}, Error: ${error.error}`).join('; ');

  return [
    { data: feature.feature },
    { data: feature.name },
    { data: feature.durationMillis.toString() },
    { data: feature.passedCount.toString() },
    { data: feature.failedCount.toString() },
    { data: statusIcon },
    { data: errors },
  ];
};

const getScenarioErrorDetails = async (qualifiedName, baseDir) => {
  const detailedReportPath = path.join(
    baseDir,
    'target',
    'karate-reports',
    `${qualifiedName}.karate-json.txt`
  );

  try {
    const detailedContent = await fs.readFile(detailedReportPath, 'utf-8');
    const detailedData = JSON.parse(detailedContent);
    return detailedData.scenarioResults
      .filter((result) => result.failed)
      .map((result) => ({
        name: result.name,
        error: result.error,
      }));
  } catch (e) {
    core.error(`Error reading detailed report for ${qualifiedName}: ${e}`);
    return [];
  }
};

const generateTestSummary = async (baseDir) => {
  try {
    const summaryFilePath = path.join(baseDir, 'target', 'karate-reports', 'karate-summary-json.txt');

    // Check if the summary file exists
    try {
      await fs.access(summaryFilePath);
    } catch (e) {
      core.error(`Summary file ${summaryFilePath} does not exist.`);
      return;
    }

    const fileContent = await fs.readFile(summaryFilePath, 'utf-8');

    if (!fileContent) {
      core.error('No content found in summary file.');
      return;
    }

    const summaryData = JSON.parse(fileContent);

    // Validate if featureSummary exists and is an array
    if (!Array.isArray(summaryData.featureSummary)) {
      core.error('featureSummary is not an array or not found in the summary data.');
      return;
    }

    const allFeatures = summaryData.featureSummary.map((feature) => {
      return {
        feature: feature.relativePath,
        packageQualifiedName: feature.packageQualifiedName,
        name: feature.name,
        durationMillis: feature.durationMillis,
        passedCount: feature.passedCount,
        failedCount: feature.failedCount,
      };
    });

    // Initialize an array to store all the feature tables
    const allFeatureTables = [];

    core.summary.addHeading('Sanity Test Results');

    // Collect all the feature tables
    for (const feature of allFeatures) {
      const errorDetails = await getScenarioErrorDetails(feature.packageQualifiedName, baseDir);
      const featureTable = generateFeatureTable(feature, errorDetails);
      allFeatureTables.push(featureTable);
    }

    // Add the final table with all the feature tables
    core.summary.addTable([
      [
        { data: 'Feature Name', header: true },
        { data: 'Scenario Name', header: true },
        { data: 'Duration (ms)', header: true },
        { data: 'Passed', header: true },
        { data: 'Failed', header: true },
        { data: 'Status', header: true },
        { data: 'Error', header: true },
      ],
      ...allFeatureTables,
    ]);

    await core.summary.write();
  } catch (error) {
    core.error(`Error generating test summary: ${error}`);
    throw error;
  }
};

module.exports = { generateTestSummary, generateFeatureTable, getScenarioErrorDetails };
