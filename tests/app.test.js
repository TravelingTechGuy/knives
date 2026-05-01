import { describe, it, beforeEach, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const steels = JSON.parse(readFileSync(path.resolve(process.cwd(), 'steels.json'), 'utf8'));

let app;

const setupDOM = () => {
  document.body.innerHTML = `
    <input id="steel-search" />
    <button id="clear-filter"></button>
    <select id="sort-select"><option value="name">Name</option></select>
    <div id="steel-grid"></div>
    <div id="steel-count"></div>
  `;
};

beforeEach(async () => {
  setupDOM();
  // Provide minimal canvas getContext and Chart mock for jsdom tests
  if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.getContext) {
    // ensure canvases return a dummy 2D context
    HTMLCanvasElement.prototype.getContext = function () {
      return {
        fillRect: () => {},
        clearRect: () => {},
        getImageData: () => ({ data: [] }),
        putImageData: () => {},
        createImageData: () => [],
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        fillText: () => {},
        measureText: () => ({ width: 0 }),
        transform: () => {},
        rotate: () => {},
        translate: () => {},
        scale: () => {},
        restore: () => {}
      };
    };
  }

  // Minimal Chart mock so initChart can construct without Chart.js
  globalThis.Chart = class {
    constructor(ctx, cfg) {
      this.ctx = ctx;
      this.cfg = cfg;
      // no-op
    }
  };
  // Import app after DOM is prepared
  app = await import('../app.js');
});

describe('App main functionality', () => {
  it('renders all steels initially', () => {
    app.renderCards();
    const countText = document.getElementById('steel-count').innerText;
    expect(countText).toBe(`Total Steels: ${steels.length}`);
    const grid = document.getElementById('steel-grid');
    expect(grid.children.length).toBe(steels.length);
  });

  it('filters by search term', () => {
    const search = document.getElementById('steel-search');
    search.value = '1095';
    app.renderCards();
    const grid = document.getElementById('steel-grid');
    // Expect at least one result and that names include the term
    expect(grid.children.length).toBeGreaterThan(0);
    const firstName = grid.children[0].querySelector('h2').textContent;
    expect(firstName.toLowerCase()).toContain('1095');
  });

  it('clear filter button resets search and results', async () => {
    const search = document.getElementById('steel-search');
    const clearBtn = document.getElementById('clear-filter');

    // Wire events
    app.handleEvents();

    search.value = '1095';
    // ensure filtered
    app.renderCards();
    const gridBefore = document.getElementById('steel-grid');
    expect(gridBefore.children.length).toBeGreaterThan(0);

    // Click clear
    clearBtn.click();

    // After clearing, input should be empty and full list rendered
    expect(search.value).toBe('');
    const gridAfter = document.getElementById('steel-grid');
    expect(gridAfter.children.length).toBe(steels.length);
  });

  it('toggles more info (metallurgy view) on info button click', () => {
    app.renderCards();
    const grid = document.getElementById('steel-grid');
    expect(grid.children.length).toBeGreaterThan(0);
    const firstCard = grid.children[0];
    const infoBtn = firstCard.querySelector('.info-btn');
    const metallurgy = firstCard.querySelector('.metallurgy-view');
    expect(metallurgy).toBeTruthy();

    // Click to toggle
    infoBtn.click();
    expect(metallurgy.classList.contains('active')).toBe(true);

    // Click again to hide
    infoBtn.click();
    expect(metallurgy.classList.contains('active')).toBe(false);
  });
});
