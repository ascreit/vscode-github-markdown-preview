(function () {
  const renderedAttribute = 'data-github-markdown-preview-rendered';
  const zoomStep = 0.25;
  const minZoom = 0.25;
  const maxZoom = 4;
  let isRendering = false;
  let activeDialog = undefined;

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
        theme: 'default',
        flowchart: {
          htmlLabels: false,
          useMaxWidth: true,
          nodeSpacing: 52,
          rankSpacing: 68,
          curve: 'basis'
        },
        sequence: {
          useMaxWidth: false,
          wrap: false,
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
          const viewport = panel.querySelector('.diagram-viewport');
          viewport.innerHTML = result.svg || '';
          panel.querySelector('.diagram-expand-button').disabled = !viewport.querySelector('svg');
        } catch (error) {
          const viewport = panel.querySelector('.diagram-viewport');
          viewport.classList.add('diagram-error');
          viewport.textContent = error instanceof Error ? error.message : String(error);
          panel.querySelector('.diagram-expand-button').remove();
        }
      }
    } finally {
      isRendering = false;
    }
  }

  function createPanel() {
    const panel = document.createElement('section');
    panel.className = 'diagram-panel';

    const expandButton = document.createElement('button');
    expandButton.className = 'diagram-expand-button';
    expandButton.type = 'button';
    expandButton.title = 'Open diagram';
    expandButton.setAttribute('aria-label', 'Open diagram in a larger view');
    expandButton.disabled = true;
    expandButton.innerHTML = [
      '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">',
      '<path d="M3 3h4v1.5H5.6l2.7 2.7-1.1 1.1-2.7-2.7V7H3V3Zm6 0h4v4h-1.5V5.6L8.8 8.3 7.7 7.2l2.7-2.7H9V3Zm-1.8 4.7 1.1 1.1-2.7 2.7H7V13H3V9h1.5v1.4l2.7-2.7Zm2.6 0 2.7 2.7V9H14v4h-4v-1.5h1.4L8.7 8.8l1.1-1.1Z"></path>',
      '</svg>'
    ].join('');
    expandButton.addEventListener('click', () => {
      openDiagramDialog(panel);
    });

    const viewport = document.createElement('div');
    viewport.className = 'diagram-viewport';

    panel.append(expandButton, viewport);
    return panel;
  }

  function openDiagramDialog(panel) {
    const svg = panel.querySelector('.diagram-viewport svg');

    if (!svg) {
      return;
    }

    closeDiagramDialog();

    let zoom = 1;
    const dialog = document.createElement('div');
    dialog.className = 'diagram-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Expanded diagram');
    dialog.tabIndex = -1;

    const surface = document.createElement('div');
    surface.className = 'diagram-dialog-surface';

    const closeButton = createDialogButton('x', 'Close diagram', closeDiagramDialog);
    closeButton.classList.add('diagram-dialog-close');

    const viewport = document.createElement('div');
    viewport.className = 'diagram-dialog-viewport';

    const canvas = document.createElement('div');
    canvas.className = 'diagram-dialog-canvas';

    const graph = document.createElement('div');
    graph.className = 'diagram-dialog-graph';
    const clonedSvg = svg.cloneNode(true);
    rewriteSvgIds(clonedSvg, `github-markdown-preview-dialog-${Date.now()}`);
    graph.append(clonedSvg);
    canvas.append(graph);
    viewport.append(canvas);

    const controls = document.createElement('div');
    controls.className = 'diagram-dialog-controls';

    const zoomOutButton = createDialogButton('-', 'Zoom out', () => {
      setZoom(zoom - zoomStep);
    });
    const zoomLabel = document.createElement('span');
    zoomLabel.className = 'diagram-dialog-zoom-label';
    const zoomInButton = createDialogButton('+', 'Zoom in', () => {
      setZoom(zoom + zoomStep);
    });
    const resetButton = createDialogButton('100%', 'Reset zoom', () => {
      setZoom(1);
    });

    controls.append(zoomOutButton, zoomLabel, zoomInButton, resetButton);
    surface.append(closeButton, viewport, controls);
    dialog.append(surface);
    document.body.append(dialog);
    activeDialog = dialog;

    const naturalSize = getSvgSize(clonedSvg);
    clonedSvg.style.width = `${naturalSize.width}px`;
    clonedSvg.style.height = `${naturalSize.height}px`;

    function setZoom(nextZoom, origin) {
      const previousZoom = zoom;
      zoom = Math.min(maxZoom, Math.max(minZoom, nextZoom));
      canvas.style.width = `${naturalSize.width * zoom}px`;
      canvas.style.height = `${naturalSize.height * zoom}px`;
      graph.style.transform = `scale(${zoom})`;
      zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
      zoomOutButton.disabled = zoom <= minZoom;
      zoomInButton.disabled = zoom >= maxZoom;

      if (origin && previousZoom !== zoom) {
        viewport.scrollLeft = ((viewport.scrollLeft + origin.x) * zoom / previousZoom) - origin.x;
        viewport.scrollTop = ((viewport.scrollTop + origin.y) * zoom / previousZoom) - origin.y;
      }
    }

    dialog.addEventListener('click', event => {
      if (event.target === dialog) {
        closeDiagramDialog();
      }
    });

    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeDiagramDialog();
      }
    });

    viewport.addEventListener('wheel', event => {
      if (!event.ctrlKey) {
        return;
      }

      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const origin = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      const scaleFactor = Math.exp(-event.deltaY * 0.01);
      setZoom(zoom * scaleFactor, origin);
    }, { passive: false });

    setZoom(1);
    closeButton.focus();
  }

  function createDialogButton(text, label, onClick) {
    const button = document.createElement('button');
    button.className = 'diagram-dialog-button';
    button.type = 'button';
    button.textContent = text;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.addEventListener('click', onClick);
    return button;
  }

  function closeDiagramDialog() {
    if (!activeDialog) {
      return;
    }

    activeDialog.remove();
    activeDialog = undefined;
  }

  function getSvgSize(svg) {
    const viewBox = svg.viewBox && svg.viewBox.baseVal;
    const width = parseSvgLength(svg.getAttribute('width')) || (viewBox && viewBox.width);
    const height = parseSvgLength(svg.getAttribute('height')) || (viewBox && viewBox.height);

    return {
      width: Math.max(width || 640, 1),
      height: Math.max(height || 360, 1)
    };
  }

  function parseSvgLength(value) {
    if (!value) {
      return undefined;
    }

    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function rewriteSvgIds(svg, prefix) {
    const idMap = new Map();
    const elementsWithIds = [
      ...(svg.id ? [svg] : []),
      ...Array.from(svg.querySelectorAll('[id]'))
    ];

    for (const element of elementsWithIds) {
      const id = element.id;

      if (!id) {
        continue;
      }

      const nextId = `${prefix}-${id}`;
      idMap.set(id, nextId);
      element.id = nextId;
    }

    if (!idMap.size) {
      return;
    }

    const attributes = [
      'clip-path',
      'fill',
      'filter',
      'href',
      'marker-end',
      'marker-mid',
      'marker-start',
      'mask',
      'stroke',
      'style',
      'xlink:href'
    ];
    const allElements = [svg, ...Array.from(svg.querySelectorAll('*'))];

    for (const element of allElements) {
      for (const attribute of attributes) {
        const value = element.getAttribute(attribute);

        if (!value) {
          continue;
        }

        element.setAttribute(attribute, replaceSvgIdReferences(value, idMap));
      }
    }

    for (const style of Array.from(svg.querySelectorAll('style'))) {
      if (style.textContent) {
        style.textContent = replaceSvgIdReferences(style.textContent, idMap);
      }
    }
  }

  function replaceSvgIdReferences(value, idMap) {
    let nextValue = value;

    for (const [id, nextId] of idMap) {
      const escapedId = escapeRegExp(id);
      nextValue = nextValue
        .replace(new RegExp(`url\\((['"]?)#${escapedId}\\1\\)`, 'g'), `url($1#${nextId}$1)`)
        .replace(new RegExp(`#${escapedId}(?=[\\s"'();{},.:#>+~\\[]|$)`, 'g'), `#${nextId}`);
    }

    return nextValue;
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
