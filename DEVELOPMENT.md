# Development

This extension adds scripts and styles to VS Code's built-in Markdown preview through `markdown.previewScripts` and `markdown.previewStyles`.

## Files

- `src/extension.ts`: Extension host commands for switching between Markdown source and preview.
- `src/preview.ts`: Browser-side script injected into Markdown Preview.
- `extension.js`: Compiled extension host entry point.
- `media/preview.js`: Compiled Markdown Preview script.
- `media/preview.css`: Markdown Preview and Mermaid styling.
- `media/mermaid.min.js`: Bundled Mermaid runtime.
- `package.json`: VS Code extension manifest.

## Local Development

Open this repository in VS Code or Cursor and run `F5` or `Debug: Start Debugging`.

In the Extension Development Host, open `examples/mermaid.md` and show the built-in Markdown Preview.

Run checks with:

```bash
npm run check
```

Build a VSIX with:

```bash
npm run package
```

To test the VSIX locally, run `Extensions: Install from VSIX...` in VS Code or Cursor and select the generated `.vsix` file.

## Updating Mermaid

`media/mermaid.min.js` is copied from the `mermaid` npm package.

After updating the `mermaid` version in `package.json`, refresh the bundled runtime:

```bash
npm install
cp node_modules/mermaid/dist/mermaid.min.js media/mermaid.min.js
```
