// ./report.js

const fs = require('fs').promises;
const path = require('path');
const core = require('@actions/core');

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
      core.error("featureSummary is not an array or not found in the summary data.");
      return;
    }

    const allFeatures = summaryData.featureSummary.map((feature) => {
      return {
        name: feature.packageQualifiedName,
        durationMillis: feature.durationMillis,
        passedCount: feature.passedCount,
        failedCount: feature.failedCount
      };
    });

    const generateFeatureTable = (feature) => {
      const statusIcon = feature.failedCount > 0 ? '❌' : '✅';
      return `| ${feature.name} | ${feature.durationMillis} | ${feature.passedCount} | ${feature.failedCount} | ${statusIcon} |`;
    };

    const tableHeader = `| Feature Name | Duration (ms) | Passed | Failed | Status |`;
    const tableDivider = `| --- | --- | --- | --- | --- |`;
    if (process.env.GITHUB_ACTIONS) {
      core.summary
        .addHeading('Test Results')
        .addCodeBlock(JSON.stringify(summaryData, null, 2), 'json');

      allFeatures.forEach((feature) => {
        core.summary.addMarkdown(`${feature.packageQualifiedName}.feature\n${tableHeader}\n${tableDivider}\n${generateFeatureTable(feature)}`);
      });

      await core.summary.write();
    } else {
      const tableString = allFeatures.map((feature) => generateFeatureTable(feature)).join('\n');
      core.info(`Test Results:\n${tableHeader}\n${tableDivider}\n${tableString}`);
    }

  } catch (error) {
    core.error(`Error generating test summary: ${error}`);
    throw error;
  }
};

module.exports = { generateTestSummary };
