"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require('vscode');
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('githubMarkdownPreview.showPreview', showPreview), vscode.commands.registerCommand('githubMarkdownPreview.showMarkdown', showMarkdown));
    return {
        extendMarkdownIt(md) {
            md.core.ruler.push('github-markdown-preview-mermaid', (state) => {
                for (const token of state.tokens) {
                    if (token.type === 'fence' && token.info.trim().split(/\s+/)[0].toLowerCase() === 'mermaid') {
                        token.type = 'github_markdown_preview_mermaid';
                    }
                }
            });
            md.renderer.rules['github_markdown_preview_mermaid'] = (tokens, idx) => {
                const token = tokens[idx];
                return `<pre class="github-markdown-preview-mermaid">${md.utils.escapeHtml(token.content)}</pre>\n`;
            };
            return md;
        }
    };
}
async function showPreview(uri) {
    const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;
    if (!targetUri) {
        vscode.window.showWarningMessage('Open a Markdown file before opening Preview.');
        return;
    }
    try {
        await vscode.commands.executeCommand('markdown.showPreview', targetUri);
    }
    catch (error) {
        vscode.window.showWarningMessage(`Could not open Markdown preview: ${getMessage(error)}`);
    }
}
async function showMarkdown() {
    try {
        await vscode.commands.executeCommand('markdown.showSource');
    }
    catch (error) {
        vscode.window.showWarningMessage(`Could not return to Markdown source: ${getMessage(error)}`);
    }
}
function deactivate() { }
function getMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
