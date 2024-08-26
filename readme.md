# Mo Documentation Updater Action

This GitHub Action uses Claude, an AI assistant, to automatically add or update documentation comments in your code when specific labels are applied to a pull request.

## Features

- Automatically adds documentation comments (JSDoc, PyDoc, etc.) to modified or new files in a pull request
- Supports multiple programming languages
- Triggered by a specific label on pull requests
- Removes the trigger label after processing

## Setup

### Prerequisites

1. An Anthropic API key for Claude
2. GitHub repository with Actions enabled

### Installation

1. Create a new workflow file (e.g., `.github/workflows/mo-documentation-updater.yml`) in your repository.
2. Copy the following workflow configuration:

```yaml
name: Mo Documentation Updater

permissions:
  contents: write
  pull-requests: write

on:
  pull_request:
    types: [labeled]

jobs:
  update-documentation:
    name: Update Documentation
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
      
      - name: Setup Node.js environment
        uses: actions/setup-node@v3
      
      - name: Run Mo Documentation Updater
        uses: felipemantilla-gorillalogic/mo-docs@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          trigger-label: 'mo-docs'
```


### Configuration

1. Go to your repository's Settings > Secrets and add a new repository secret:
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key

2. Ensure your repository has the necessary permissions set for GitHub Actions:
   - Go to Settings > Actions > General
   - Under "Workflow permissions", select "Read and write permissions"

## Usage

1. Create or update a pull request in your repository.
2. Add the label specified in your workflow file (default is 'mo-docs') to the pull request.
3. The action will automatically run, adding or updating documentation comments in the changed files.
4. After processing, the action will remove the trigger label.

## Customization

You can customize the behavior of the action by modifying the inputs in your workflow file:

- `github-token`: The GitHub token used for authentication (default: `${{ secrets.GITHUB_TOKEN }}`)
- `anthropic-api-key`: Your Anthropic API key for Claude (required)
- `trigger-label`: The label that triggers the documentation update (default: 'mo-docs')

## Contributing

Contributions to improve the action are welcome! Please feel free to submit issues or pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.