const vscode = require('vscode');

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('githubMarkdownPreview.showPreview', showPreview),
    vscode.commands.registerCommand('githubMarkdownPreview.showMarkdown', showMarkdown)
  );
}

async function showPreview(uri) {
  const targetUri = uri || vscode.window.activeTextEditor?.document.uri;

  if (!targetUri) {
    vscode.window.showWarningMessage('Open a Markdown file before opening Preview.');
    return;
  }

  try {
    await vscode.commands.executeCommand('markdown.showPreview', targetUri);
  } catch (error) {
    vscode.window.showWarningMessage(`Could not open Markdown preview: ${getMessage(error)}`);
  }
}

async function showMarkdown() {
  try {
    await vscode.commands.executeCommand('markdown.showSource');
  } catch (error) {
    vscode.window.showWarningMessage(`Could not return to Markdown source: ${getMessage(error)}`);
  }
}

function deactivate() {}

function getMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

module.exports = {
  activate,
  deactivate
};
