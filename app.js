import steelData from './steels.json' with { type: 'json' };

const tierColors = {
  'Super Steel': { bg: 'rgba(251, 191, 36, 0.1)', border: '#fbbf24', glow: 'rgba(251, 191, 36, 0.5)' },
  'Premium': { bg: 'rgba(167, 139, 250, 0.1)', border: '#a78bfa', glow: 'rgba(167, 139, 250, 0.5)' },
  'Budget': { bg: 'rgba(45, 212, 191, 0.1)', border: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.5)' }
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
  "Si": "Silicon",
  "Ni": "Nickel",
  "P": "Phosphorus",
  "S": "Sulfur"
};

function init() {
  const grid = document.getElementById('steel-grid');
  const databaseInfo = document.getElementById('database-info');
  const sortSelect = document.getElementById('sort-select');
  const searchInput = document.getElementById('steel-search');
  const clearButton = document.getElementById('clear-search');

  function toggleClearButton() {
    clearButton.style.display = searchInput.value ? 'flex' : 'none';
  }

  // event listeners
  searchInput.addEventListener('input', (e) => {
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

  // Main rendering function
  function renderCards(filterString = '') {
    const sortBy = document.getElementById('sort-select').value;
    grid.innerHTML = '';

    const searchTerms = filterString.split(',')
      .map(term => term.trim().toLowerCase())
      .filter(term => term !== '');

    const filtered = steelData.filter(steel => {
      if (searchTerms.length === 0) return true;

      const mathFilters = searchTerms.filter(t => t.match(/[><=]/));
      const nameOrTierFilters = searchTerms.filter(t => !t.match(/[><=]/));

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

      const matchesName = nameOrTierFilters.length === 0 || nameOrTierFilters.some(term =>
        steel.name.toLowerCase().includes(term) ||
        steel.tier.toLowerCase().includes(term)
      );

      return matchesMath && matchesName;
    });

    // Sorting logic
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'tier') {
        return tierPriority[a.tier] - tierPriority[b.tier] || a.name.localeCompare(b.name);
      } else {
        // Numerical sorts (toughness, corrosion, etc.) - Descending (highest first)
        return b[sortBy] - a[sortBy] || a.name.localeCompare(b.name);
      }
    });

    // Update count display
    document.getElementById('steel-count').innerText = `Total Steels: ${filtered.length}`;

    filtered.forEach(steel => {
      const card = document.createElement('div');
      card.className = 'card';

      // Get the specific border color for this tier
      const tierColor = tierColors[steel.tier].border;

      // Set the CSS variables for the glow AND the specific tier color
      card.style.setProperty('--hover-glow', tierColor.replace('1)', '0.4)'));
      card.style.setProperty('--tier-color', tierColor);
      // card.style.setProperty('--hover-glow', tierColors[steel.tier].border.replace('1)', '0.4)'));
      const tierSlug = steel.tier.toLowerCase().replace(' ', '-');

      // Sort composition descending by percentage
      const sortedComposition = Object.entries(steel.composition).sort(([, a], [, b]) => b - a);

      card.innerHTML = `
            <div class="card-header">
              <span class="badge tier-${tierSlug}">${steel.tier}</span>
              <button class="info-btn" data-tooltip="More Info">
                <svg style="pointer-events: none;" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </button>
            </div>
            <h2 style="margin-top: 0;">${steel.name}</h2>
            <canvas id="chart-${steel.id}"></canvas>

            <div class="metallurgy-view">
              <div class="composition-grid">
                ${sortedComposition.map(([element, value]) => `
                  <div class="comp-item element-tooltip" data-tooltip="${elementNames[element] || element}">
                    <span class="comp-label">${element}</span>
                    <span class="comp-val">${value}%</span>
                  </div>
                `).join('')}
              </div>
              <div class="process-text">
                <strong>Process:</strong> ${steel.process}
              </div>
            </div>
          `;
      grid.appendChild(card);

      const infoBtn = card.querySelector('.info-btn');
      const metView = card.querySelector('.metallurgy-view');

      infoBtn.onclick = (e) => {
        e.stopPropagation();
        const isActive = metView.classList.toggle('active');
        // Toggle an attribute so CSS can handle the active color
        infoBtn.setAttribute('data-active', isActive);
      };

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
    });
  }

  // Run once on load
  toggleClearButton();

  renderCards();
}

document.addEventListener('DOMContentLoaded', init);
