import steelData from './steels.json' with { type: 'json' };

const tierColors = {
  "Super Steel": { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 1)' },
  "Premium": { bg: 'rgba(167, 139, 250, 0.2)', border: 'rgba(167, 139, 250, 1)' },
  "Budget": { bg: 'rgba(45, 212, 191, 0.2)', border: 'rgba(45, 212, 191, 1)' }
};

const tierPriority = {
  "Super Steel": 1,
  "Premium": 2,
  "Budget": 3
};

const elementNames = {
  "C": "Carbon",
  "Cr": "Chromium",
  "V": "Vanadium",
  "Mo": "Molybdenum",
  "N": "Nitrogen",
  "Nb": "Niobium",
  "Co": "Cobalt",
  "W": "Tungsten",
  "Mn": "Manganese",
  "Ni": "Nickel",
  "P": "Phosphorus",
  "S": "Sulfur",
  "Si": "Silicon"
};

// Tooltip manager (closed over handlers and state)
const tooltipManager = (() => {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  let bound = {
    mouseEnter: null,
    mouseLeave: null,
    touchStart: null,
    click: null,
    docTouch: null,
    docClick: null
  };

  const getElements = () => Array.from(document.querySelectorAll('.element-tooltip, .info-btn'));

  const hideAll = () => {
    document.querySelectorAll('.tooltip-element').forEach(el => el.remove());
    getElements().forEach(el => el.removeAttribute('data-active'));
  };

  const createFloatingTooltip = (target, text) => {
    const existingId = target.getAttribute('data-tooltip-id');
    if (existingId) {
      const existing = document.getElementById(existingId);
      if (existing) {
        existing.textContent = text;
        existing.style.display = 'block';
        return existing;
      }
    }

    const id = `tooltip-${Date.now()}-${Math.floor(Math.random()*10000)}`;
    const el = document.createElement('div');
    el.className = 'tooltip-element';
    el.id = id;
    el.textContent = text;
    el.style.position = 'fixed';
    el.style.display = 'block';
    el.style.pointerEvents = 'none';
    el.style.zIndex = 9999;
    el.style.visibility = 'hidden';
    document.body.appendChild(el);

    const rect = target.getBoundingClientRect();
    const padding = 8;
    const elRect = el.getBoundingClientRect();
    let left = rect.left + (rect.width / 2) - (elRect.width / 2);
    left = Math.max(padding, Math.min(left, window.innerWidth - elRect.width - padding));
    const top = rect.bottom + 8;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.visibility = 'visible';

    target.setAttribute('data-tooltip-id', id);
    return el;
  };

  const removeFloatingTooltip = (target) => {
    const id = target.getAttribute('data-tooltip-id');
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
    target.removeAttribute('data-tooltip-id');
  };

  const showTooltip = (e) => {
    const target = e.currentTarget || e.target;
    const text = target.getAttribute('data-tooltip');
    if (!text) return;
    createFloatingTooltip(target, text);
  };

  const hideTooltip = (e) => {
    const target = e.currentTarget || e.target;
    if (!target) return;
    removeFloatingTooltip(target);
  };

  const handleTouch = (e) => {
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget || e.target;
    if (!target) return;

    // remove other tooltips
    document.querySelectorAll('.tooltip-element').forEach(el => {
      if (!target.contains(el)) el.remove();
    });

    const id = target.getAttribute('data-tooltip-id');
    if (id && document.getElementById(id)) {
      removeFloatingTooltip(target);
      target.removeAttribute('data-active');
    } else {
      const text = target.getAttribute('data-tooltip');
      if (!text) return;
      createFloatingTooltip(target, text);
      target.setAttribute('data-active', 'true');
    }
  };

  const bind = () => {
    const els = getElements();

    // prepare bound handlers so removeEventListener works
    bound.mouseEnter = showTooltip;
    bound.mouseLeave = hideTooltip;
    bound.touchStart = handleTouch;
    bound.click = handleTouch;

    els.forEach(el => {
      el.removeEventListener('mouseenter', bound.mouseEnter);
      el.removeEventListener('mouseleave', bound.mouseLeave);
      el.removeEventListener('touchstart', bound.touchStart);
      el.removeEventListener('click', bound.click);

      if (isTouchDevice) {
        el.addEventListener('touchstart', bound.touchStart, { passive: false });
        el.addEventListener('click', bound.click);
      } else {
        el.addEventListener('mouseenter', bound.mouseEnter);
        el.addEventListener('mouseleave', bound.mouseLeave);
      }
    });

    if (isTouchDevice) {
      bound.docTouch = (ev) => {
        const t = ev.target;
        if (!t.closest('.info-btn') && !t.closest('.element-tooltip') && !t.closest('.tooltip-element')) hideAll();
      };
      bound.docClick = (ev) => {
        const t = ev.target;
        if (!t.closest('.info-btn') && !t.closest('.element-tooltip') && !t.closest('.tooltip-element')) hideAll();
      };

      document.removeEventListener('touchstart', bound.docTouch);
      document.removeEventListener('click', bound.docClick);
      document.addEventListener('touchstart', bound.docTouch, { passive: true });
      document.addEventListener('click', bound.docClick);
    }
  };

  return {
    init() { bind(); },
    bind,
    hideAll,
    isTouchDevice
  };
})();

// Theme management
const themeManager = {
  // Get system preference
  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },

  // Get current theme from the document or fallback to system preference
  getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || this.getSystemTheme();
  },

  // Set theme
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  },

  // Toggle between themes
  toggleTheme() {
    const newTheme = this.getCurrentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  },

  // Initialize theme system
  init() {
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      this.setTheme(newTheme);
    });

    // Set initial theme from OS preference
    const initialTheme = this.getCurrentTheme();
    this.setTheme(initialTheme);

    // Setup toggle button
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleTheme());
    }
  }
};

// Helper: Create the Metallurgy HTML
const createMetallurgyHTML = steel => {
  const sortedComposition = Object.entries(steel.composition).sort(([, a], [, b]) => b - a);

  return `
    <div class="metallurgy-view">
      <div class="composition-grid">
        ${sortedComposition.map(([el, val]) => `
          <div class="comp-item element-tooltip" data-tooltip="${elementNames[el] || el}">
            <span class="comp-label">${el}</span>
            <span class="comp-val">${val}%</span>
          </div>
        `).join('')}
      </div>
      <div class="process-text"><strong>Process:</strong> ${steel.process}</div>
    </div>
  `;
};

// Helper: Initialize the Radar Chart
const initChart = steel => {
  const ctx = document.getElementById(`chart-${steel.id}`).getContext('2d');
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Toughness', 'Corrosion', 'Retention', 'Sharpening'],
      datasets: [{
        data: [steel.toughness, steel.corrosion, steel.retention, steel.sharpening],
        backgroundColor: tierColors[steel.tier].bg,
        borderColor: tierColors[steel.tier].border,
        borderWidth: 3,
        pointBackgroundColor: tierColors[steel.tier].border,
        pointRadius: 5,
        pointHoverRadius: 9,
        pointHoverBackgroundColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      layout: { padding: 15 },
      interaction: {
        mode: 'nearest',
        intersect: false,
      },
      scales: {
        r: {
          min: 0, max: 10,
          grid: { color: '#334155' },
          angleLines: { color: '#334155' },
          pointLabels: {
            color: '#94a3b8',
            font: { size: 12, weight: 'bold' },
            padding: 10
          },
          ticks: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: 12,
          displayColors: false,
          position: 'average'
        }
      }
    }
  });
};

// Main Render Function
const renderCards = () => {
  const grid = document.getElementById('steel-grid');
  const searchVal = document.getElementById('steel-search').value.toLowerCase();
  const sortBy = document.getElementById('sort-select').value;

  grid.innerHTML = '';

  // 1. Filter Logic
  const searchTerms = searchVal.split(',')
    .map(term => term.trim().toLowerCase())
    .filter(term => term !== '');

  let filtered = steelData.filter(steel => {
    if (searchTerms.length === 0) return true;

    // Separate math filters (e.g., toughness > 5) from text filters (e.g., M390)
    const mathFilters = searchTerms.filter(t => t.match(/[><=]/));
    const textFilters = searchTerms.filter(t => !t.match(/[><=]/));

    // Must match ALL math criteria
    const matchesMath = mathFilters.every(term => {
      const match = term.match(/(toughness|corrosion|retention|sharpening)\s*([><=])\s*(\d+)/);
      if (match) {
        const [_, attr, operator, value] = match;
        const targetValue = parseInt(value);
        const actualValue = steel[attr];
        if (operator === '>') return actualValue > targetValue;
        if (operator === '<') return actualValue < targetValue;
        if (operator === '=') return actualValue === targetValue;
      }
      return false;
    });

    // Must match AT LEAST ONE text criteria (Name or Tier)
    const matchesText = textFilters.length === 0 || textFilters.some(term =>
      steel.name.toLowerCase().includes(term) ||
      steel.tier.toLowerCase().includes(term)
    );

    return matchesMath && matchesText;
  });

  // 2. Sort Logic
  filtered.sort((a, b) => {
    if (sortBy === 'name')
      return a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: 'base'
    });
    if (sortBy === 'tier')
      return tierPriority[a.tier] - tierPriority[b.tier] || a.name.localeCompare(b.name);
    return b[sortBy] - a[sortBy] || a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: 'base'
    })
  });

  // 3. Render Logic
  filtered.forEach(steel => {
    const card = document.createElement('div');
    card.className = 'card';
    const color = tierColors[steel.tier].border;
    card.style.setProperty('--tier-color', color);
    card.style.setProperty('--hover-glow', color.replace('1)', '0.4)'));

    card.innerHTML = `
      <div class="card-header">
        <span class="badge tier-${steel.tier.toLowerCase().replace(' ', '-')}">${steel.tier}</span>
        <button class="info-btn" data-tooltip="More Info">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        </button>
      </div>
      <h2 style="margin-top: 0;">${steel.name}</h2>
      <canvas id="chart-${steel.id}"></canvas>
      ${createMetallurgyHTML(steel)}
    `;

    grid.appendChild(card);
    initChart(steel);

    // Toggle Logic
    const btn = card.querySelector('.info-btn');
    btn.onclick = e => {
      e.stopPropagation();
      const isActive = card.querySelector('.metallurgy-view').classList.toggle('active');
      btn.setAttribute('data-active', isActive);
    };
  });

  document.getElementById('steel-count').innerText = `Total Steels: ${filtered.length}`;
};

const handleEvents = () => {
  const searchInput = document.getElementById('steel-search');
  const clearButton = document.getElementById('clear-filter');
  const sortSelect = document.getElementById('sort-select');

  const toggleClearButton = () => {
    clearButton.style.display = searchInput.value ? 'flex' : 'none';
  };

  // initialize the clear button state on load
  toggleClearButton();

  // event listeners
  searchInput.addEventListener('input', e => {
    toggleClearButton();
    renderCards(e.target.value);
  });

  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    toggleClearButton();
    searchInput.focus();
    renderCards();
  });

  sortSelect.addEventListener('change', () => {
    renderCards(searchInput.value);
  });
};

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
  themeManager.init();
  handleEvents();
  renderCards();
  // Setup tooltips after initial load
  tooltipManager.init();
});

export { renderCards, handleEvents, tooltipManager };
