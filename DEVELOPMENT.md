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

## Release Versioning

This project follows Semantic Versioning in the `major.minor.patch` format required by npm and VS Code Marketplace.

- Use a patch release, such as `1.0.1`, for bug fixes, documentation corrections, packaging fixes, and small behavior fixes that do not add a user-visible capability.
- Use a minor release, such as `1.1.0`, for user-visible feature additions, workflow improvements, new commands, new settings, or meaningful UI behavior improvements that keep existing usage compatible.
- Use a major release, such as `2.0.0`, for breaking changes to commands, settings, documented behavior, supported VS Code versions, or expected Markdown/Mermaid rendering behavior.

Before `1.0.0`, `0.x` releases may be used while the extension is still experimental. Publish `1.0.0` when the core user workflow is stable enough to support without intentionally breaking it in routine releases.

For this extension, `1.0.0` means:

- Mermaid diagrams render reliably in VS Code's built-in Markdown Preview.
- The documented preview, expanded view, zoom, fit, pan, and close interactions work as described.
- Marketplace metadata, README, icon, and changelog are release-ready.
- Future changes are expected to preserve the current core workflow unless a new major version is planned.

## Updating Mermaid

`media/mermaid.min.js` is copied from the `mermaid` npm package.

After updating the `mermaid` version in `package.json`, refresh the bundled runtime:

```bash
npm install
cp node_modules/mermaid/dist/mermaid.min.js media/mermaid.min.js
```
