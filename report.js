// ./report.js

const fs = require('fs').promises;
const path = require('path');
const core = require('@actions/core');

const generateFeatureTable = (feature) => {
  const statusIcon = feature.failedCount > 0 ? '❌' : '✅';
  return [
    { data: feature.name },
    { data: feature.durationMillis.toString() },
    { data: feature.passedCount.toString() },
    { data: feature.failedCount.toString() },
    { data: statusIcon },
  ];
};

const convertFeatureTableToMarkdown = (featureTableArray) => {
  return '| ' + featureTableArray.map(cell => cell.data).join(' | ') + ' |';
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
        name: feature.name,
        durationMillis: feature.durationMillis,
        passedCount: feature.passedCount,
        failedCount: feature.failedCount,
      };
    });

    if (process.env.GITHUB_ACTIONS) {
      core.summary.addHeading('Test Results');
      core.summary.addCodeBlock(JSON.stringify(summaryData, null, 2), 'json');

      allFeatures.forEach((feature) => {
        const featureTable = generateFeatureTable(feature);
        core.summary
          .addHeading(`${feature.feature}.feature`)
          .addTable([
            [
              { data: 'Feature Name', header: true },
              { data: 'Duration (ms)', header: true },
              { data: 'Passed', header: true },
              { data: 'Failed', header: true },
              { data: 'Status', header: true },
            ],
            featureTable,
          ]);
      });

      await core.summary.write();
    } else {
      const tableHeader = `| Feature Name | Duration (ms) | Passed | Failed | Status |`;
      const tableDivider = `| --- | --- | --- | --- | --- |`;
      const tableString = allFeatures.map((feature) => {
        const featureTable = generateFeatureTable(feature);
        return convertFeatureTableToMarkdown(featureTable);
      }).join('\n');
      core.info(`Test Results:\n${tableHeader}\n${tableDivider}\n${tableString}`);
    }
  } catch (error) {
    core.error(`Error generating test summary: ${error}`);
    throw error;
  }
};

module.exports = { generateTestSummary, generateFeatureTable };
