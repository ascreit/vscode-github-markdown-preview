import type * as Vscode from 'vscode';

const vscode: typeof import('vscode') = require('vscode');

export function activate(context: Vscode.ExtensionContext): object {
  context.subscriptions.push(
    vscode.commands.registerCommand('githubMarkdownPreview.showPreview', showPreview),
    vscode.commands.registerCommand('githubMarkdownPreview.showMarkdown', showMarkdown)
  );

  return {
    extendMarkdownIt(md: any): any {
      md.core.ruler.push('github-markdown-preview-mermaid', (state: any) => {
        for (const token of state.tokens) {
          if (token.type === 'fence' && token.info.trim().split(/\s+/)[0].toLowerCase() === 'mermaid') {
            token.type = 'github_markdown_preview_mermaid';
          }
        }
      });

      md.renderer.rules['github_markdown_preview_mermaid'] = (tokens: any[], idx: number): string => {
        const token = tokens[idx];
        return `<pre class="github-markdown-preview-mermaid">${md.utils.escapeHtml(token.content)}</pre>\n`;
      };

      return md;
    }
  };
}

async function showPreview(uri?: Vscode.Uri): Promise<void> {
  const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;

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

async function showMarkdown(): Promise<void> {
  try {
    await vscode.commands.executeCommand('markdown.showSource');
  } catch (error) {
    vscode.window.showWarningMessage(`Could not return to Markdown source: ${getMessage(error)}`);
  }
}

export function deactivate(): void {}

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
