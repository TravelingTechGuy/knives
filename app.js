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
    this.updateToggleButton(theme);
  },

  // Toggle between themes
  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  },

  // Update toggle button icon
  updateToggleButton(theme) {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    const svg = toggleBtn.querySelector('svg');
    if (theme === 'light') {
      // Moon icon for light theme (switch to dark)
      svg.innerHTML = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      `;
    } else {
      // Sun icon for dark theme (switch to light)
      svg.innerHTML = `
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      `;
    }
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
  const clearButton = document.getElementById('clear-search');
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

// Tooltip handling for mobile devices
const setupTooltips = () => {
  // Check if device is touch-enabled
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Get all tooltip elements
  const tooltipElements = document.querySelectorAll('.element-tooltip, .info-btn');

  tooltipElements.forEach(element => {
    // Remove existing event listeners to prevent duplicates
    element.removeEventListener('mouseenter', showTooltip);
    element.removeEventListener('mouseleave', hideTooltip);
    element.removeEventListener('touchstart', handleTouchTooltip);

    if (isTouchDevice) {
      // For touch devices, use touch events
      element.addEventListener('touchstart', handleTouchTooltip);
    } else {
      // For non-touch devices, use hover events
      element.addEventListener('mouseenter', showTooltip);
      element.addEventListener('mouseleave', hideTooltip);
    }
  });
};

// Show tooltip function
const showTooltip = (event) => {
  const tooltip = event.currentTarget;
  const tooltipText = tooltip.getAttribute('data-tooltip');

  // Create tooltip element if it doesn't exist
  let tooltipElement = tooltip.querySelector('.tooltip-element');
  if (!tooltipElement) {
    tooltipElement = document.createElement('div');
    tooltipElement.className = 'tooltip-element';
    tooltip.appendChild(tooltipElement);
  }

  tooltipElement.textContent = tooltipText;
  tooltipElement.style.display = 'block';
};

// Hide tooltip function
const hideTooltip = (event) => {
  const tooltip = event.currentTarget;
  const tooltipElement = tooltip.querySelector('.tooltip-element');
  if (tooltipElement) {
    tooltipElement.style.display = 'none';
  }
};

// Handle touch tooltip
const handleTouchTooltip = (event) => {
  event.preventDefault();
  const tooltip = event.currentTarget;

  // Toggle tooltip visibility on touch
  const tooltipElement = tooltip.querySelector('.tooltip-element');
  if (tooltipElement) {
    tooltipElement.style.display = tooltipElement.style.display === 'block' ? 'none' : 'block';
  } else {
    // Create tooltip if it doesn't exist
    const tooltipText = tooltip.getAttribute('data-tooltip');
    const newTooltipElement = document.createElement('div');
    newTooltipElement.className = 'tooltip-element';
    newTooltipElement.textContent = tooltipText;
    newTooltipElement.style.display = 'block';
    tooltip.appendChild(newTooltipElement);
  }
};

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
  themeManager.init();
  handleEvents();
  renderCards();

  // Setup tooltips after initial load
  setupTooltips();
});
