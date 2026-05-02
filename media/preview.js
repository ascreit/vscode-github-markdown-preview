(function () {
  const renderedAttribute = 'data-github-markdown-preview-rendered';
  let isRendering = false;

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
      return;
    }

    callback();
  }

  function getMermaidBlocks() {
    return Array.from(document.querySelectorAll('pre > code.language-mermaid, pre > code.lang-mermaid'));
  }

  function sleep(milliseconds) {
    return new Promise(resolve => {
      window.setTimeout(resolve, milliseconds);
    });
  }

  async function waitForMermaid() {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      if (globalThis.mermaid) {
        return globalThis.mermaid;
      }

      await sleep(50);
    }

    return undefined;
  }

  async function renderMermaidBlocks() {
    if (isRendering) {
      return;
    }

    isRendering = true;

    const mermaid = await waitForMermaid();

    if (!mermaid) {
      showLoadErrors('Mermaid library was not loaded.');
      isRendering = false;
      return;
    }

    try {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: document.body.classList.contains('vscode-dark') ? 'dark' : 'default',
        flowchart: {
          htmlLabels: false,
          useMaxWidth: true,
          nodeSpacing: 52,
          rankSpacing: 68,
          curve: 'basis'
        },
        sequence: {
          useMaxWidth: true,
          wrap: true,
          width: 180,
          messageMargin: 48,
          boxMargin: 12
        },
        themeVariables: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", "Hiragino Sans", sans-serif',
          fontSize: '15px',
          lineHeight: '1.45'
        }
      });

      const blocks = getMermaidBlocks();

      for (let index = 0; index < blocks.length; index += 1) {
        const code = blocks[index];
        const pre = code.parentElement;

        if (!pre || pre.getAttribute(renderedAttribute) === 'true') {
          continue;
        }

        pre.setAttribute(renderedAttribute, 'true');
        const source = code.textContent || '';
        const panel = createPanel();
        pre.replaceWith(panel);

        try {
          const result = await mermaid.render(`github-markdown-preview-mermaid-${Date.now()}-${index}`, source);
          panel.querySelector('.diagram-viewport').innerHTML = result.svg || '';
        } catch (error) {
          const viewport = panel.querySelector('.diagram-viewport');
          viewport.classList.add('diagram-error');
          viewport.textContent = error instanceof Error ? error.message : String(error);
        }
      }
    } finally {
      isRendering = false;
    }
  }

  function createPanel() {
    const panel = document.createElement('section');
    panel.className = 'diagram-panel';

    const viewport = document.createElement('div');
    viewport.className = 'diagram-viewport';

    panel.append(viewport);
    return panel;
  }

  function showLoadErrors(message) {
    for (const code of getMermaidBlocks()) {
      const pre = code.parentElement;

      if (!pre || pre.getAttribute(renderedAttribute) === 'true') {
        continue;
      }

      pre.setAttribute(renderedAttribute, 'true');
      const panel = createPanel();
      const viewport = panel.querySelector('.diagram-viewport');
      viewport.classList.add('diagram-error');
      viewport.textContent = `${message}\n\n${code.textContent || ''}`;
      pre.replaceWith(panel);
    }
  }

  ready(() => {
    renderMermaidBlocks();

    const observer = new MutationObserver(() => {
      renderMermaidBlocks();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})();
