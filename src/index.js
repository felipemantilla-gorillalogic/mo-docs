const core = require('@actions/core');
const github = require('@actions/github');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');

const generateDocPrompt = (fileContent, fileName) => {
  const fileExtension = path.extname(fileName).toLowerCase();
  let docType;

  if (['.js', '.ts', '.jsx', '.tsx'].includes(fileExtension)) {
    docType = 'JSDoc';
  } else if (['.py'].includes(fileExtension)) {
    docType = 'PyDoc';
  } else {
    docType = 'appropriate documentation style';
  }

  return `
    Please add ${docType} comments to the following code. Focus on adding documentation for functions, classes, and important variables. Do not modify the existing code, only add comments. Here's the code:

    ${fileContent}

    Provide the updated code with added documentation comments.
  `;
};

const main = async () => {
  // Auth with GitHub
  const token = core.getInput('github-token', { required: true });
  const octokit = github.getOctokit(token);

  // Auth with Anthropic
  const anthropicApiKey = core.getInput('anthropic-api-key', { required: true });
  const anthropic = new Anthropic({
    apiKey: anthropicApiKey,
  });

  // Getting PR data
  const requiredLabel = core.getInput('trigger-label', { required: true });
  const context = github.context;
  const { owner, repo } = context.repo;
  const pull_number = context.payload.pull_request ? context.payload.pull_request.number : context.payload.issue.number;

  core.info("Fetching PR details...");
  const { data: pullRequest } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number,
  });

  // Check if the required label is present
  const isRequiredLabelPresent = pullRequest.labels.some(
    (label) => label.name === requiredLabel
  );

  if (!isRequiredLabelPresent) {
    console.log(`Required label ${requiredLabel} not present. Skipping documentation update.`);
    return;
  }

  if (pullRequest.state === 'closed' || pullRequest.locked) {
    console.log('Invalid event payload');
    return 'Invalid event payload';
  }

  const { data } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number,
  });

  const changedFiles = data;

  for (const file of changedFiles) {
    if (file.status !== 'modified' && file.status !== 'added') {
      continue;
    }

    try {
      // Fetch file content
      const fileContent = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: file.filename,
        ref: pullRequest.head.sha,
      });

      const decodedContent = Buffer.from(fileContent.data.content, 'base64').toString('utf-8');

      // Generate documentation using Claude
      const prompt = generateDocPrompt(decodedContent, file.filename);
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      const updatedContent = message.content[0].text;

      // Update the file with new content
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: file.filename,
        message: `Add documentation comments to ${file.filename}`,
        content: Buffer.from(updatedContent).toString('base64'),
        sha: fileContent.data.sha,
        branch: pullRequest.head.ref,
      });

      console.log(`Updated ${file.filename} with documentation comments`);
    } catch (e) {
      console.error(`Failed to update ${file.filename}`, e);
    }
  }

  // Remove label
  await octokit.rest.issues.removeLabel({
    owner,
    repo,
    issue_number: pull_number,
    name: requiredLabel,
  }).catch(e => {
    console.error('Failed to remove label', e);
  });

  console.log('Documentation update completed successfully');
};

main().catch(err => {
  console.error(err);
  core.setFailed(err.message);
});