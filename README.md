# Knife Steel Performance

A web application for visualizing and comparing the performance characteristics of various knife steels. This app displays radar charts showing toughness, corrosion resistance, edge retention, and sharpening ease for different steel types.

## Features

- **Interactive Radar Charts**: Each steel is displayed with a radar chart showing its performance across four key metrics
- **Advanced Filtering**: Search and filter steels by name, tier, or specific attributes
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Search**: Instant filtering as you type

## How to Use the Filter

The search box supports multiple filtering options:

### Basic Name/Tier Filtering
- Enter steel names separated by commas: `M390, MagnaCut, D2`
- Filter by tier: `Budget, Super Steel`

### Advanced Attribute Filtering
Use mathematical operators to filter by specific properties:
- `toughness > 7` - Show steels with toughness greater than 7
- `corrosion >= 8` - Show steels with corrosion resistance of 8 or higher
- `retention < 5` - Show steels with edge retention less than 5
- `sharpening = 4` - Show steels with sharpening ease exactly 4

### Combining Filters
You can combine multiple filters using commas:
- `toughness > 7, corrosion > 8` - Must meet both conditions (AND logic)
- `M390, toughness > 7` - Show M390 OR any steel with toughness > 7 (OR logic for name/tier, AND for attributes)

### Clear Filter
- Click the × button that appears in the search box when text is entered to clear the filter and show all steels

## Running the Application

1. **Simple Method**: Open `index.html` directly in your web browser
2. **Server Method** (recommended for full functionality):
   ```bash
   python3 -m http.server 8080
   ```
   or
   ```bash
   npm run serve
   ```
   Then open `http://localhost:8080` in your browser

## Technologies Used

- **HTML5** - Structure and content
- **CSS3** - Styling and animations
- **JavaScript (ES6 Modules)** - Interactivity and data handling
- **Chart.js** - Radar chart visualization

## Data Source

Steel performance data is stored in `steels.json` and includes information about various knife steel types categorized by tier (Budget, Premium, Super Steel).

## Browser Support

Works in all modern browsers that support ES6 modules and the import assertions syntax.

## License

© 2026 Traveling Tech Guy LLC
