/**
 * CDF Defect Dashboard
 *
 * Creates an interactive dashboard on the "Charts" tab that visualizes
 * employee defect data from the CDF (Customer Delivery Feedback) dataset.
 *
 * Data Source: "raw data" tab (manually populated with CDF CSV data)
 * Output: "Charts" tab with slicers, pie chart, bar chart, and ranking table
 *
 * Column mapping from "raw data" tab:
 *   C - Delivery Associate Name
 *   D - DA Mishandled Package (0/1)
 *   E - DA was Unprofessional (0/1)
 *   F - DA did not follow my delivery instructions (0/1)
 *   G - Delivered to Wrong Address (0/1)
 *   H - Never Received Delivery (0/1)
 *   I - Received Wrong Item (0/1)
 *   J - Feedback Details (text)
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  sheets: {
    source: 'raw data',
    dashboard: 'Charts',
    slicerData: 'Defect Data',  // Hidden sheet for slicer data (must start at row 1)
    scorecardData: 'Scorecard raw data'  // Sheet with packages delivered data (column AP)
  },

  // Expected column headers in the raw data (for flexible lookup)
  headers: {
    employeeName: 'Employee Name',
    feedbackDetails: 'Feedback Details'
  },

  // Defect categories with their expected column headers and display info
  categories: [
    { header: 'DA Mishandled Package', display: 'Mishandled Package', color: '#ea4335' },
    { header: 'DA was Unprofessional', display: 'Unprofessional', color: '#ff6d01' },
    { header: 'DA did not follow my delivery instructions', display: 'Instructions Not Followed', color: '#fbbc04' },
    { header: 'Delivered to Wrong Address', display: 'Wrong Address', color: '#34a853' },
    { header: 'Never Received Delivery', display: 'Never Received', color: '#4285f4' },
    { header: 'Received Wrong Item', display: 'Wrong Item', color: '#9c27b0' }
  ],

  // Layout constants - edit anchor cells and sizes here
  // Row/Col numbers are 1-based (A=1, B=2, etc.)
  layout: {
    // Slicers at top
    slicerAnchorRow: 1,
    employeeSlicerCol: 1,   // Column A
    categorySlicerCol: 4,   // Column D

    // Header (below slicers)
    titleRow: 4,
    instructionsRow: 5,

    // Ranking tables (columns A-I)
    rankingTableRow: 6,     // Bottom performers table
    topPerformersRow: 24,   // Top performers table

    // Pie chart - anchor cell
    pieChartRow: 6,         // L6
    pieChartCol: 12,        // Column L (moved over for Packages column)

    // Category bar chart - anchor cell
    categoryChartRow: 21,   // L21
    categoryChartCol: 12,   // Column L (moved over for Packages column)

    // Defect-free vs defects pie chart - anchor cell
    defectSplitChartRow: 36,
    defectSplitChartCol: 12,

    // Chart dimensions (pixels)
    chartWidth: 400,
    chartHeight: 300,

    // Hidden data areas (for chart sources)
    hiddenDataStartRow: 80
  }
};

// =============================================================================
// ENTRY POINTS
// =============================================================================

/**
 * Creates the custom menu when the spreadsheet opens
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Defect Dashboard')
    .addItem('Refresh Dashboard', 'refreshDashboard')
    .addItem('Reset Filters', 'resetFilters')
    .addSeparator()
    .addItem('Help', 'showHelp')
    .addToUi();
}

/**
 * Main entry point - refreshes the entire dashboard
 */
function refreshDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  // Get source data
  const rawDataSheet = ss.getSheetByName(CONFIG.sheets.source);
  if (!rawDataSheet) {
    ui.alert('Error', `Please create a sheet named "${CONFIG.sheets.source}" and paste your CDF CSV data there.`, ui.ButtonSet.OK);
    return;
  }

  const rawData = rawDataSheet.getDataRange().getValues();
  if (rawData.length < 2) {
    ui.alert('Error', `No data found in "${CONFIG.sheets.source}" sheet. Please add data with headers.`, ui.ButtonSet.OK);
    return;
  }

  // Find column indices from headers
  const columnMap = findColumnIndices(rawData[0]);
  if (!columnMap.employeeName) {
    ui.alert('Error', 'Could not find employee name column. Expected "Delivery Associate Name" or "Employee Name" in headers.', ui.ButtonSet.OK);
    return;
  }

  // Get or create the Charts sheet
  let chartsSheet = ss.getSheetByName(CONFIG.sheets.dashboard);
  if (chartsSheet) {
    // Clear existing content but preserve the sheet
    clearDashboard(chartsSheet);
  } else {
    chartsSheet = ss.insertSheet(CONFIG.sheets.dashboard);
  }

  // Get packages delivered data first (needed for employee list and DPMO)
  const packagesData = getPackagesDeliveredData(ss);

  // Process and normalize data
  const normalizedData = normalizeDataForSlicers(rawData, columnMap);
  const employeeSummary = createEmployeeSummary(rawData, columnMap, packagesData);

  // Build the dashboard
  buildDashboard(chartsSheet, normalizedData, employeeSummary, columnMap, packagesData);

  chartsSheet.activate();
  ui.alert('Dashboard Refreshed', 'The CDF Defect Dashboard has been updated.\n\nUse the slicers to filter by employee or category.', ui.ButtonSet.OK);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Finds column indices based on header text
 * @param {Array} headers - First row of data (headers)
 * @returns {Object} Map of column names to indices (0-based)
 */
function findColumnIndices(headers) {
  const columnMap = {
    employeeName: null,
    feedbackDetails: null,
    categories: {}
  };

  headers.forEach((header, index) => {
    const headerStr = String(header).trim();

    // Check for employee name column (supports "Employee Name" or "Delivery Associate Name")
    if ((headerStr.toLowerCase().includes('employee') && headerStr.toLowerCase().includes('name')) ||
        (headerStr.toLowerCase().includes('delivery associate name'))) {
      columnMap.employeeName = index;
    }

    // Check for feedback details column
    if (headerStr.toLowerCase().includes('feedback') && headerStr.toLowerCase().includes('detail')) {
      columnMap.feedbackDetails = index;
    }

    // Check for category columns
    CONFIG.categories.forEach(cat => {
      if (headerStr === cat.header || headerStr.toLowerCase() === cat.header.toLowerCase()) {
        columnMap.categories[cat.header] = index;
      }
    });
  });

  return columnMap;
}

/**
 * Converts a 1-based column number to letter(s)
 * @param {number} column - 1-based column number
 * @returns {string} Column letter(s)
 */
function columnToLetter(column) {
  let letter = '';
  while (column > 0) {
    const remainder = (column - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    column = Math.floor((column - 1) / 26);
  }
  return letter;
}

/**
 * Gets a background color based on defect severity (percentage of max)
 * Higher defects = redder colors
 * @param {number} value - Current defect count
 * @param {number} maxValue - Maximum defect count in the dataset
 * @returns {string} Hex color code
 */
function getDefectColor(value, maxValue) {
  if (maxValue === 0 || value === 0) return '#c8e6c9'; // Green - no defects

  // For low absolute counts, use lighter colors regardless of percentage
  if (value === 1) return '#aed581';           // Light green - single defect
  if (value === 2) return '#ffeb3b';           // Yellow - two defects

  const percentage = (value / maxValue) * 100;

  if (percentage >= 80) return '#f44336';      // Red - critical
  if (percentage >= 60) return '#ff7043';      // Orange-red - high
  if (percentage >= 40) return '#ff9800';      // Orange - moderate
  if (percentage >= 20) return '#ffeb3b';      // Yellow - some issues
  if (percentage > 0) return '#aed581';        // Light green - minor
  return '#c8e6c9';                            // Green - none
}

/**
 * Gets text color (black or white) based on background brightness
 * @param {string} bgColor - Hex background color
 * @returns {string} '#000000' or '#ffffff'
 */
function getContrastTextColor(bgColor) {
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#000000' : '#ffffff';
}

// =============================================================================
// DATA PROCESSING
// =============================================================================

/**
 * Normalizes raw data into one row per defect occurrence
 * This format allows slicers to work properly
 * @param {Array} rawData - Raw data from source sheet
 * @param {Object} columnMap - Column index mapping
 * @returns {Array} Normalized data with headers
 */
function normalizeDataForSlicers(rawData, columnMap) {
  const headers = [
    'Employee Name',
    'Category',
    'Count'
  ];

  // Add helper columns for each category (for SUBTOTAL formulas)
  CONFIG.categories.forEach((cat, i) => {
    headers.push('Cat' + (i + 1));
  });

  const normalizedData = [headers];
  const dataRows = rawData.slice(1); // Skip header row

  dataRows.forEach(row => {
    const employeeName = row[columnMap.employeeName];
    if (!employeeName) return;

    CONFIG.categories.forEach((cat, catIndex) => {
      const colIndex = columnMap.categories[cat.header];
      if (colIndex === undefined) return;

      const flagValue = Number(row[colIndex]) || 0;
      if (flagValue > 0) {
        const rowData = [
          employeeName,
          cat.display,
          flagValue
        ];

        // Add helper columns (1 for matching category, 0 for others)
        CONFIG.categories.forEach((_, i) => {
          rowData.push(i === catIndex ? 1 : 0);
        });

        normalizedData.push(rowData);
      }
    });
  });

  return normalizedData;
}

/**
 * Creates an employee summary with total defects and per-category breakdowns
 * Includes all employees from Scorecard data, even those with 0 defects
 * @param {Array} rawData - Raw data from source sheet
 * @param {Object} columnMap - Column index mapping
 * @param {Object} packagesData - Map of employee name to packages delivered (optional)
 * @returns {Array} Array of employee objects sorted by total defects (descending)
 */
function createEmployeeSummary(rawData, columnMap, packagesData) {
  const employeeMap = {};
  const dataRows = rawData.slice(1);

  // First, add all employees from packages data with 0 defects
  // This ensures we include employees who had no defects
  if (packagesData) {
    Object.keys(packagesData).forEach(employeeName => {
      if (!employeeMap[employeeName]) {
        employeeMap[employeeName] = {
          name: employeeName,
          total: 0,
          categories: {}
        };
        CONFIG.categories.forEach(cat => {
          employeeMap[employeeName].categories[cat.display] = 0;
        });
      }
    });
  }

  // Then process defect data
  dataRows.forEach(row => {
    const employeeName = row[columnMap.employeeName];
    if (!employeeName) return;

    if (!employeeMap[employeeName]) {
      employeeMap[employeeName] = {
        name: employeeName,
        total: 0,
        categories: {}
      };
      CONFIG.categories.forEach(cat => {
        employeeMap[employeeName].categories[cat.display] = 0;
      });
    }

    CONFIG.categories.forEach(cat => {
      const colIndex = columnMap.categories[cat.header];
      if (colIndex === undefined) return;

      const flagValue = Number(row[colIndex]) || 0;
      employeeMap[employeeName].categories[cat.display] += flagValue;
      employeeMap[employeeName].total += flagValue;
    });
  });

  // Convert to array and sort by total (descending)
  // Include all employees (even those with 0 defects)
  return Object.values(employeeMap)
    .sort((a, b) => b.total - a.total);
}

/**
 * Gets packages delivered data from the Scorecard raw data sheet
 * @param {Spreadsheet} ss - The active spreadsheet
 * @returns {Object} Map of employee name to packages delivered count
 */
function getPackagesDeliveredData(ss) {
  const packagesMap = {};

  const scorecardSheet = ss.getSheetByName(CONFIG.sheets.scorecardData);
  if (!scorecardSheet) {
    return packagesMap;
  }

  const data = scorecardSheet.getDataRange().getValues();
  if (data.length < 2) {
    return packagesMap;
  }

  const headers = data[0];

  // Find Employee Name column (look for common variations)
  let employeeCol = -1;
  for (let i = 0; i < headers.length; i++) {
    const header = String(headers[i]).toLowerCase().trim();
    if (header.includes('employee') && header.includes('name')) {
      employeeCol = i;
      break;
    }
    if (header === 'name' || header === 'da name' || header === 'driver name' || header.includes('delivery associate')) {
      employeeCol = i;
      break;
    }
  }

  // Column AP is index 41 (0-based: A=0, B=1, ... AP=41)
  const packagesCol = 41;

  if (employeeCol === -1) {
    return packagesMap;
  }

  // Build the packages map
  for (let i = 1; i < data.length; i++) {
    const employeeName = String(data[i][employeeCol]).trim();
    const packages = Number(data[i][packagesCol]) || 0;

    if (employeeName && packages > 0) {
      // If employee appears multiple times, sum their packages
      if (packagesMap[employeeName]) {
        packagesMap[employeeName] += packages;
      } else {
        packagesMap[employeeName] = packages;
      }
    }
  }

  return packagesMap;
}

/**
 * Calculates DPMO (Defects Per Million Opportunities)
 * @param {number} defects - Number of defects
 * @param {number} packages - Number of packages delivered
 * @returns {number} DPMO value rounded to nearest integer, or null if no packages
 */
function calculateDPMO(defects, packages) {
  if (!packages || packages === 0) {
    return null;
  }
  return Math.round((defects / packages) * 1000000);
}

// =============================================================================
// DASHBOARD BUILDING
// =============================================================================

/**
 * Clears existing dashboard content while preserving the sheet
 * @param {Sheet} sheet - The Charts sheet to clear
 */
function clearDashboard(sheet) {
  // Remove all charts
  const charts = sheet.getCharts();
  charts.forEach(chart => sheet.removeChart(chart));

  // Remove all slicers
  const slicers = sheet.getSlicers();
  slicers.forEach(slicer => slicer.remove());

  // Clear all content and formatting
  sheet.clear();
}

/**
 * Builds the complete dashboard
 * @param {Sheet} sheet - The Charts sheet
 * @param {Array} normalizedData - Normalized defect data
 * @param {Array} employeeSummary - Employee summary data
 * @param {Object} columnMap - Column index mapping
 */
function buildDashboard(sheet, normalizedData, employeeSummary, columnMap, packagesData) {
  const layout = CONFIG.layout;
  const ss = sheet.getParent();

  // Create or get the hidden data sheet for slicers (data must start at row 1)
  let dataSheet = ss.getSheetByName(CONFIG.sheets.slicerData);
  if (dataSheet) {
    dataSheet.clear();
  } else {
    dataSheet = ss.insertSheet(CONFIG.sheets.slicerData);
  }

  // Write normalized data to the data sheet starting at row 1
  const dataRowCount = normalizedData.length;
  const dataColCount = normalizedData[0].length;

  dataSheet.getRange(1, 1, dataRowCount, dataColCount).setValues(normalizedData);
  dataSheet.getRange(1, 1, 1, dataColCount)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');

  // Keep data sheet visible (required for cross-sheet slicers to work)
  dataSheet.showSheet();

  SpreadsheetApp.flush();

  // Build visible dashboard components in layout order:
  // 1. Slicers at top (rows 1-3)
  createSlicers(sheet, dataSheet, dataRowCount, dataColCount);

  // 2. Header (below slicers)
  buildHeader(sheet);

  // 3. Bottom performers ranking table (with DPMO)
  // Calculate how many employees have defects for dynamic positioning
  const employeesWithDefects = employeeSummary.filter(emp => emp.total > 0).length;
  buildRankingTable(sheet, employeeSummary, packagesData);

  // 4. Top performers table (with DPMO) - position dynamically after bottom performers
  // Bottom performers: header row + column headers row + data rows + 2 blank rows
  const topPerformersStartRow = layout.rankingTableRow + 2 + employeesWithDefects + 2;
  buildTopPerformersTable(sheet, employeeSummary, packagesData, topPerformersStartRow);

  // 5. Category summary chart and pie chart
  buildCategorySummary(sheet, dataSheet, dataRowCount);
  createPieChart(sheet);

  // 6. Defect-free vs with-defects pie chart
  createDefectSplitPieChart(sheet, employeeSummary);

  // Set column widths for ranking table
  sheet.setColumnWidth(1, 50);   // Rank
  sheet.setColumnWidth(2, 180);  // Employee name
  for (let i = 3; i <= 8; i++) {
    sheet.setColumnWidth(i, 80); // Category columns
  }
  sheet.setColumnWidth(9, 55);   // Total
  sheet.setColumnWidth(10, 70);  // DPMO
  sheet.setColumnWidth(11, 75);  // Packages

  // Freeze rows including slicers and header
  sheet.setFrozenRows(5);
}

/**
 * Builds the dashboard header section
 * @param {Sheet} sheet - The Charts sheet
 */
function buildHeader(sheet) {
  const layout = CONFIG.layout;

  // Title (span across ranking table width: Rank + Employee + 6 categories + Total + DPMO + Packages = 11)
  sheet.getRange(layout.titleRow, 1, 1, 11).merge();
  sheet.getRange(layout.titleRow, 1)
    .setValue('CDF Defect Dashboard')
    .setFontSize(20)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setBackground('#1a73e8')
    .setFontColor('#ffffff');

  // Instructions
  sheet.getRange(layout.instructionsRow, 1, 1, 11).merge();
  sheet.getRange(layout.instructionsRow, 1)
    .setValue('Use slicers to filter by employee or category. DPMO = Defects Per Million Opportunities (defects/packages × 1,000,000).')
    .setFontStyle('italic')
    .setFontColor('#666666')
    .setHorizontalAlignment('center');
}

/**
 * Builds hidden category summary data and creates a bar chart
 * Data is hidden but used as chart source (responds to slicer filters)
 * @param {Sheet} sheet - The Charts sheet
 * @param {Sheet} dataSheet - The data sheet
 * @param {number} dataRowCount - Number of rows in normalized data
 */
function buildCategorySummary(sheet, dataSheet, dataRowCount) {
  const layout = CONFIG.layout;
  const dataSheetName = dataSheet.getName();

  // Hidden data area for chart source (far right, out of view)
  const hiddenDataRow = layout.hiddenDataStartRow;
  const hiddenDataCol = 20; // Column T

  const dataStart = 2;
  const dataEnd = dataRowCount;

  // Write category names and SUBTOTAL formulas to hidden area
  CONFIG.categories.forEach((cat, i) => {
    const row = hiddenDataRow + i;
    const helperCol = 4 + i;
    const colLetter = columnToLetter(helperCol);

    sheet.getRange(row, hiddenDataCol).setValue(cat.display);
    sheet.getRange(row, hiddenDataCol + 1).setFormula(`=SUBTOTAL(109,'${dataSheetName}'!${colLetter}${dataStart}:${colLetter}${dataEnd})`);
  });

  // Hide this data (white text)
  sheet.getRange(hiddenDataRow, hiddenDataCol, CONFIG.categories.length, 2).setFontColor('#ffffff');

  SpreadsheetApp.flush();

  // Chart sources from hidden data
  const chartRange = sheet.getRange(hiddenDataRow, hiddenDataCol, CONFIG.categories.length, 2);

  const categorySummaryChart = sheet.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(chartRange)
    .setPosition(layout.categoryChartRow, layout.categoryChartCol, 0, 0)
    .setOption('title', 'Defects by Category')
    .setOption('titleTextStyle', { fontSize: 14, bold: true })
    .setOption('width', layout.chartWidth)
    .setOption('height', layout.chartHeight)
    .setOption('legend', { position: 'none' })
    .setOption('hAxis', { title: 'Count' })
    .setOption('colors', CONFIG.categories.map(cat => cat.color))
    .build();

  sheet.insertChart(categorySummaryChart);
}

/**
 * Creates employee and category slicers with proper column configuration
 * Slicers live on Charts sheet but reference data on the Defect Data sheet
 * @param {Sheet} sheet - The Charts sheet where slicers are displayed
 * @param {Sheet} dataSheet - The data sheet containing the source data
 * @param {number} dataRowCount - Number of rows in normalized data
 * @param {number} dataColCount - Number of columns in normalized data
 */
function createSlicers(sheet, dataSheet, dataRowCount, dataColCount) {
  const layout = CONFIG.layout;
  const ss = sheet.getParent();
  const dataSheetName = dataSheet.getName();

  // Build the cross-sheet range reference string
  const endColLetter = columnToLetter(dataColCount);
  const rangeA1Notation = `'${dataSheetName}'!A1:${endColLetter}${dataRowCount}`;

  // Remove any existing filter on the data sheet
  const existingFilter = dataSheet.getFilter();
  if (existingFilter) {
    existingFilter.remove();
  }

  // Remove any existing slicers on Charts sheet
  const existingSlicers = sheet.getSlicers();
  existingSlicers.forEach(s => s.remove());

  // Also remove slicers from data sheet
  const dataSlicers = dataSheet.getSlicers();
  dataSlicers.forEach(s => s.remove());

  // Get the range using spreadsheet-level range (cross-sheet)
  const dataRange = ss.getRange(rangeA1Notation);

  // Employee slicer on Charts sheet, referencing data sheet
  const employeeSlicer = sheet.insertSlicer(
    dataRange,
    layout.slicerAnchorRow,
    layout.employeeSlicerCol
  );
  employeeSlicer.setTitle('Filter by Employee');
  const empCriteria = SpreadsheetApp.newFilterCriteria().setHiddenValues([]).build();
  employeeSlicer.setColumnFilterCriteria(1, empCriteria);

  // Category slicer
  const categorySlicer = sheet.insertSlicer(
    dataRange,
    layout.slicerAnchorRow,
    layout.categorySlicerCol
  );
  categorySlicer.setTitle('Filter by Category');
  const catCriteria = SpreadsheetApp.newFilterCriteria().setHiddenValues([]).build();
  categorySlicer.setColumnFilterCriteria(2, catCriteria);

  // Force update
  SpreadsheetApp.flush();
}

/**
 * Creates a pie chart showing defect distribution by category
 * Sources from hidden data so it responds to filters
 * @param {Sheet} sheet - The Charts sheet
 */
function createPieChart(sheet) {
  const layout = CONFIG.layout;

  SpreadsheetApp.flush();

  // Chart data from hidden area (same as category bar chart)
  const hiddenDataRow = layout.hiddenDataStartRow;
  const hiddenDataCol = 20; // Column T
  const chartRange = sheet.getRange(hiddenDataRow, hiddenDataCol, CONFIG.categories.length, 2);

  const chart = sheet.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(chartRange)
    .setPosition(layout.pieChartRow, layout.pieChartCol, 0, 0)
    .setOption('title', 'Defect Distribution by Category')
    .setOption('titleTextStyle', { fontSize: 14, bold: true })
    .setOption('width', layout.chartWidth)
    .setOption('height', layout.chartHeight)
    .setOption('is3D', true)
    .setOption('pieSliceText', 'percentage')
    .setOption('legend', { position: 'right', textStyle: { fontSize: 10 } })
    .setOption('slices', {
      0: { color: CONFIG.categories[0].color },
      1: { color: CONFIG.categories[1].color },
      2: { color: CONFIG.categories[2].color },
      3: { color: CONFIG.categories[3].color },
      4: { color: CONFIG.categories[4].color },
      5: { color: CONFIG.categories[5].color }
    })
    .build();

  sheet.insertChart(chart);
}

/**
 * Creates a pie chart showing the split between employees with 0 defects vs 1+ defects
 * @param {Sheet} sheet - The Charts sheet
 * @param {Array} employeeSummary - Employee summary data
 */
function createDefectSplitPieChart(sheet, employeeSummary) {
  const layout = CONFIG.layout;

  // Calculate counts
  const zeroDefectCount = employeeSummary.filter(emp => emp.total === 0).length;
  const withDefectCount = employeeSummary.filter(emp => emp.total > 0).length;

  // Write data to hidden area
  const hiddenDataRow = layout.hiddenDataStartRow + 10; // Offset from other hidden data
  const hiddenDataCol = 20; // Column T

  sheet.getRange(hiddenDataRow, hiddenDataCol, 2, 2).setValues([
    ['0 Defects', zeroDefectCount],
    ['1+ Defects', withDefectCount]
  ]);

  // Hide this data (white text)
  sheet.getRange(hiddenDataRow, hiddenDataCol, 2, 2).setFontColor('#ffffff');

  SpreadsheetApp.flush();

  const chartRange = sheet.getRange(hiddenDataRow, hiddenDataCol, 2, 2);

  const chart = sheet.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(chartRange)
    .setPosition(layout.defectSplitChartRow, layout.defectSplitChartCol, 0, 0)
    .setOption('title', 'Employees: Defect-Free vs With Defects')
    .setOption('titleTextStyle', { fontSize: 14, bold: true })
    .setOption('width', layout.chartWidth)
    .setOption('height', layout.chartHeight)
    .setOption('is3D', true)
    .setOption('pieSliceText', 'percentage')
    .setOption('legend', { position: 'right', textStyle: { fontSize: 10 } })
    .setOption('slices', {
      0: { color: '#34a853' },  // Green for 0 defects
      1: { color: '#ea4335' }   // Red for 1+ defects
    })
    .build();

  sheet.insertChart(chart);
}

/**
 * Creates a bar chart showing top 10 employees by defect count
 * Uses SUBTOTAL formulas to respond to slicer filters
 * Colors bars based on severity (matching heat map colors from ranking tables)
 * Uses stacked bar approach to enable per-bar coloring
 * @param {Sheet} sheet - The Charts sheet
 * @param {Sheet} dataSheet - The data sheet with normalized data
 * @param {number} dataRowCount - Number of rows in data sheet
 * @param {Array} employeeSummary - Employee summary data (for getting unique names)
 */
function createBarChart(sheet, dataSheet, dataRowCount, employeeSummary) {
  const layout = CONFIG.layout;
  const dataSheetName = dataSheet.getName();

  const chartDataRow = layout.hiddenDataStartRow;
  const chartDataCol = 23;  // Column W
  const top10 = employeeSummary.slice(0, 10);
  const maxTotal = employeeSummary.length > 0 ? employeeSummary[0].total : 1;

  // Create transposed data structure for per-bar coloring
  // Row 1: Header with "Label" then each employee name
  // Row 2: "Defects" then each employee's value (only their column has value, others 0)
  // This creates a stacked bar where each employee is their own series

  // Header row: Label, Emp1, Emp2, ...
  const headerRow = ['Label'];
  top10.forEach(emp => headerRow.push(emp.name));
  sheet.getRange(chartDataRow, chartDataCol, 1, headerRow.length).setValues([headerRow]);

  // Data row: Single row with "Defects" label, then formulas for each employee
  sheet.getRange(chartDataRow + 1, chartDataCol).setValue('Defects');

  top10.forEach((emp, i) => {
    const col = chartDataCol + 1 + i;
    const name = emp.name;
    // Formula to get filtered count for this employee
    const formula = `=SUMPRODUCT(SUBTOTAL(103,OFFSET('${dataSheetName}'!A2,ROW('${dataSheetName}'!A2:A${dataRowCount})-ROW('${dataSheetName}'!A2),0,1))*('${dataSheetName}'!A2:A${dataRowCount}="${name.replace(/"/g, '""')}")*'${dataSheetName}'!C2:C${dataRowCount})`;
    sheet.getRange(chartDataRow + 1, col).setFormula(formula);
  });

  // Hide this data
  sheet.getRange(chartDataRow, chartDataCol, 2, headerRow.length).setFontColor('#ffffff');

  SpreadsheetApp.flush();

  const chartRange = sheet.getRange(chartDataRow, chartDataCol, 2, headerRow.length);

  // Build series colors - each employee gets their severity color
  const seriesConfig = {};
  top10.forEach((emp, i) => {
    seriesConfig[i] = { color: getDefectColor(emp.total, maxTotal) };
  });

  const chart = sheet.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(chartRange)
    .setPosition(layout.top10ChartRow, layout.top10ChartCol, 0, 0)
    .setOption('title', 'Top 10 Employees by Defect Count')
    .setOption('titleTextStyle', { fontSize: 14, bold: true })
    .setOption('width', layout.chartWidth)
    .setOption('height', layout.chartHeight)
    .setOption('legend', { position: 'right', textStyle: { fontSize: 9 } })
    .setOption('hAxis', { title: 'Total Defects' })
    .setOption('isStacked', true)
    .setOption('series', seriesConfig)
    .build();

  sheet.insertChart(chart);
}

/**
 * Builds the bottom performers ranking table with heat map coloring
 * @param {Sheet} sheet - The Charts sheet
 * @param {Array} employeeSummary - Employee summary data
 * @param {Object} packagesData - Map of employee name to packages delivered
 */
function buildRankingTable(sheet, employeeSummary, packagesData) {
  const layout = CONFIG.layout;
  const startRow = layout.rankingTableRow;

  // Section header (width = Rank + Employee + 6 categories + Total + DPMO + Packages = 11 columns)
  const tableWidth = 2 + CONFIG.categories.length + 3; // +3 for Total, DPMO, and Packages
  sheet.getRange(startRow, 1, 1, tableWidth).merge();
  sheet.getRange(startRow, 1)
    .setValue('Bottom Performers - Employees with Most Defects')
    .setFontWeight('bold')
    .setFontSize(14)
    .setFontColor('#d32f2f')
    .setHorizontalAlignment('center');

  // Table headers - readable category names, Total, DPMO, and Packages at the end
  const categoryHeaders = ['Mishandled', 'Unprofessional', 'Instructions', 'Wrong Addr', 'Not Received', 'Wrong Item'];
  const headers = ['Rank', 'Employee'];
  categoryHeaders.forEach(h => headers.push(h));
  headers.push('Total');
  headers.push('DPMO');
  headers.push('Packages');

  sheet.getRange(startRow + 1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(startRow + 1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#d32f2f')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center')
    .setFontSize(9);

  // Find max values for heat mapping
  const maxTotal = employeeSummary.length > 0 ? employeeSummary[0].total : 0;
  const maxByCat = {};
  CONFIG.categories.forEach(cat => {
    maxByCat[cat.display] = 0;
    employeeSummary.forEach(emp => {
      if (emp.categories[cat.display] > maxByCat[cat.display]) {
        maxByCat[cat.display] = emp.categories[cat.display];
      }
    });
  });

  // Calculate max DPMO for heat mapping
  let maxDPMO = 0;
  employeeSummary.forEach(emp => {
    const packages = packagesData[emp.name] || 0;
    const dpmo = calculateDPMO(emp.total, packages);
    if (dpmo !== null && dpmo > maxDPMO) {
      maxDPMO = dpmo;
    }
  });

  // Display all employees with defects
  const employeesWithDefects = employeeSummary.filter(emp => emp.total > 0);
  const displayCount = employeesWithDefects.length;
  const totalCol = 3 + CONFIG.categories.length; // Total is after all category columns
  const dpmoCol = totalCol + 1; // DPMO is after Total
  const packagesCol = dpmoCol + 1; // Packages is after DPMO

  for (let i = 0; i < displayCount; i++) {
    const emp = employeesWithDefects[i];
    const row = startRow + 2 + i;

    // Rank
    sheet.getRange(row, 1).setValue(i + 1);
    sheet.getRange(row, 1).setHorizontalAlignment('center');

    // Employee name
    sheet.getRange(row, 2).setValue(emp.name);

    // Category columns with heat map (columns 3 through 3+numCategories-1)
    CONFIG.categories.forEach((cat, catIndex) => {
      const col = 3 + catIndex;
      const value = emp.categories[cat.display] || 0;
      const color = getDefectColor(value, maxByCat[cat.display]);

      sheet.getRange(row, col).setValue(value);
      sheet.getRange(row, col)
        .setBackground(color)
        .setFontColor(getContrastTextColor(color))
        .setHorizontalAlignment('center');
    });

    // Total with heat map
    const totalColor = getDefectColor(emp.total, maxTotal);
    sheet.getRange(row, totalCol).setValue(emp.total);
    sheet.getRange(row, totalCol)
      .setBackground(totalColor)
      .setFontColor(getContrastTextColor(totalColor))
      .setHorizontalAlignment('center')
      .setFontWeight('bold');

    // DPMO with heat map
    const packages = packagesData[emp.name] || 0;
    const dpmo = calculateDPMO(emp.total, packages);
    if (dpmo !== null) {
      const dpmoColor = getDefectColor(dpmo, maxDPMO);
      sheet.getRange(row, dpmoCol).setValue(dpmo);
      sheet.getRange(row, dpmoCol)
        .setBackground(dpmoColor)
        .setFontColor(getContrastTextColor(dpmoColor))
        .setHorizontalAlignment('center')
        .setFontWeight('bold');
    } else {
      sheet.getRange(row, dpmoCol).setValue('N/A');
      sheet.getRange(row, dpmoCol)
        .setHorizontalAlignment('center')
        .setFontStyle('italic')
        .setFontColor('#999999');
    }

    // Packages column
    sheet.getRange(row, packagesCol).setValue(packages || 'N/A');
    sheet.getRange(row, packagesCol).setHorizontalAlignment('center');

    // Alternate row base color for non-heat-mapped cells
    const baseBg = i % 2 === 0 ? '#ffffff' : '#f5f5f5';
    sheet.getRange(row, 1).setBackground(baseBg);
    sheet.getRange(row, 2).setBackground(baseBg);
    sheet.getRange(row, packagesCol).setBackground(baseBg);
  }

  // Add borders
  sheet.getRange(startRow + 1, 1, displayCount + 1, tableWidth)
    .setBorder(true, true, true, true, true, true);
}

/**
 * Builds the top performers table showing employees with fewest defects
 * @param {Sheet} sheet - The Charts sheet
 * @param {Array} employeeSummary - Employee summary data (sorted by most defects)
 * @param {Object} packagesData - Map of employee name to packages delivered
 */
function buildTopPerformersTable(sheet, employeeSummary, packagesData, startRow) {
  const layout = CONFIG.layout;

  // Get employees with 0 defects, sorted by packages delivered (descending)
  const zeroDefectEmployees = [...employeeSummary]
    .filter(emp => emp.total === 0)
    .sort((a, b) => {
      const packagesA = packagesData[a.name] || 0;
      const packagesB = packagesData[b.name] || 0;
      return packagesB - packagesA; // Descending by packages
    });

  // If fewer than 15 have 0 defects, add next best performers (sorted by fewest defects, then most packages)
  let topPerformers = [...zeroDefectEmployees];
  if (topPerformers.length < 15) {
    const nonZeroEmployees = [...employeeSummary]
      .filter(emp => emp.total > 0)
      .sort((a, b) => {
        if (a.total !== b.total) return a.total - b.total; // Fewest defects first
        const packagesA = packagesData[a.name] || 0;
        const packagesB = packagesData[b.name] || 0;
        return packagesB - packagesA; // Then by most packages
      });
    topPerformers = topPerformers.concat(nonZeroEmployees.slice(0, 15 - topPerformers.length));
  }

  // Section header (width = Rank + Employee + 6 categories + Total + DPMO + Packages = 11 columns)
  const tableWidth = 2 + CONFIG.categories.length + 3; // +3 for Total, DPMO, and Packages
  sheet.getRange(startRow, 1, 1, tableWidth).merge();
  sheet.getRange(startRow, 1)
    .setValue('Top Performers - Employees with Fewest Defects (ranked by packages delivered)')
    .setFontWeight('bold')
    .setFontSize(14)
    .setFontColor('#2e7d32')
    .setHorizontalAlignment('center');

  // Table headers
  const categoryHeaders = ['Mishandled', 'Unprofessional', 'Instructions', 'Wrong Addr', 'Not Received', 'Wrong Item'];
  const headers = ['Rank', 'Employee'];
  categoryHeaders.forEach(h => headers.push(h));
  headers.push('Total');
  headers.push('DPMO');
  headers.push('Packages');

  sheet.getRange(startRow + 1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(startRow + 1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#2e7d32')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center')
    .setFontSize(9);

  // Calculate min DPMO for heat mapping (for top performers, lower is better)
  let minDPMO = Infinity;
  let maxDPMO = 0;
  topPerformers.forEach(emp => {
    const packages = packagesData[emp.name] || 0;
    const dpmo = calculateDPMO(emp.total, packages);
    if (dpmo !== null) {
      if (dpmo < minDPMO) minDPMO = dpmo;
      if (dpmo > maxDPMO) maxDPMO = dpmo;
    }
  });

  // Display all top performers (at least 15, or more if there are more 0-defect employees)
  const displayCount = topPerformers.length;
  const totalCol = 3 + CONFIG.categories.length;
  const dpmoCol = totalCol + 1; // DPMO is after Total
  const packagesCol = dpmoCol + 1; // Packages is after DPMO

  for (let i = 0; i < displayCount; i++) {
    const emp = topPerformers[i];
    const row = startRow + 2 + i;
    const packages = packagesData[emp.name] || 0;

    // Rank
    sheet.getRange(row, 1).setValue(i + 1);
    sheet.getRange(row, 1).setHorizontalAlignment('center');

    // Employee name
    sheet.getRange(row, 2).setValue(emp.name);

    // Category columns
    CONFIG.categories.forEach((cat, catIndex) => {
      const col = 3 + catIndex;
      const value = emp.categories[cat.display] || 0;
      sheet.getRange(row, col).setValue(value);
      sheet.getRange(row, col).setHorizontalAlignment('center');

      // Green background for zero defects
      if (value === 0) {
        sheet.getRange(row, col).setBackground('#c8e6c9');
      }
    });

    // Total
    sheet.getRange(row, totalCol).setValue(emp.total);
    sheet.getRange(row, totalCol)
      .setHorizontalAlignment('center')
      .setFontWeight('bold');

    // Green background for low totals
    if (emp.total === 0) {
      sheet.getRange(row, totalCol).setBackground('#c8e6c9');
    } else if (emp.total <= 2) {
      sheet.getRange(row, totalCol).setBackground('#aed581');
    }

    // DPMO - for top performers, use inverted coloring (low DPMO = green)
    const dpmo = calculateDPMO(emp.total, packages);
    if (dpmo !== null) {
      // Invert the color logic for top performers (low DPMO is good)
      const dpmoColor = getDPMOColorForTopPerformer(dpmo, maxDPMO);
      sheet.getRange(row, dpmoCol).setValue(dpmo);
      sheet.getRange(row, dpmoCol)
        .setBackground(dpmoColor)
        .setFontColor(getContrastTextColor(dpmoColor))
        .setHorizontalAlignment('center')
        .setFontWeight('bold');
    } else {
      sheet.getRange(row, dpmoCol).setValue('N/A');
      sheet.getRange(row, dpmoCol)
        .setHorizontalAlignment('center')
        .setFontStyle('italic')
        .setFontColor('#999999');
    }

    // Packages column
    sheet.getRange(row, packagesCol).setValue(packages || 'N/A');
    sheet.getRange(row, packagesCol).setHorizontalAlignment('center');

    // Alternate row base color
    const baseBg = i % 2 === 0 ? '#ffffff' : '#f5f5f5';
    sheet.getRange(row, 1).setBackground(baseBg);
    sheet.getRange(row, 2).setBackground(baseBg);
    sheet.getRange(row, packagesCol).setBackground(baseBg);
  }

  // Add borders
  sheet.getRange(startRow + 1, 1, displayCount + 1, tableWidth)
    .setBorder(true, true, true, true, true, true);
}

/**
 * Gets color for DPMO in top performers table (lower is better = greener)
 * @param {number} dpmo - DPMO value
 * @param {number} maxDPMO - Maximum DPMO in the dataset
 * @returns {string} Hex color code
 */
function getDPMOColorForTopPerformer(dpmo, maxDPMO) {
  if (maxDPMO === 0 || dpmo === 0) return '#c8e6c9'; // Green - no defects

  const percentage = (dpmo / maxDPMO) * 100;

  // Inverted scale - low percentage = green, high = red
  if (percentage <= 20) return '#c8e6c9';      // Green - excellent
  if (percentage <= 40) return '#aed581';      // Light green - good
  if (percentage <= 60) return '#ffeb3b';      // Yellow - moderate
  if (percentage <= 80) return '#ff9800';      // Orange - needs improvement
  return '#ff7043';                            // Orange-red - poor
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Resets all slicer filters to show all data
 */
function resetFilters() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const chartsSheet = ss.getSheetByName(CONFIG.sheets.dashboard);

  if (!chartsSheet) {
    SpreadsheetApp.getUi().alert('Error', 'Dashboard not found. Please run "Refresh Dashboard" first.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const slicers = chartsSheet.getSlicers();
  slicers.forEach(slicer => {
    try {
      // Clear all filter criteria
      const range = slicer.getRange();
      const numCols = range.getNumColumns();
      for (let col = 1; col <= numCols; col++) {
        slicer.setColumnFilterCriteria(col, null);
      }
    } catch (e) {
      // Ignore errors for columns that aren't being filtered
    }
  });

  SpreadsheetApp.getUi().alert('Filters Reset', 'All slicer filters have been cleared.', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Shows help information
 */
function showHelp() {
  const helpText = `
CDF Defect Dashboard - Help

SETUP:
1. Create a sheet named "raw data"
2. Paste your CDF CSV data (with headers in row 1)
3. Ensure "Scorecard raw data" sheet exists with packages delivered (column AP)
4. Click "Defect Dashboard" > "Refresh Dashboard"

REQUIRED COLUMNS:
- Delivery Associate Name (column C)
- Defect flags (columns D-I): 0 or 1 values
- Packages delivered in "Scorecard raw data" (column AP)

DPMO (Defects Per Million Opportunities):
- Formula: (defects / packages delivered) × 1,000,000
- Normalizes defect counts against delivery volume
- Allows fair comparison between high and low volume drivers
- Lower DPMO = better performance

USING THE DASHBOARD:
- Employee Slicer: Filter to specific employees
- Category Slicer: Filter to specific defect types
- Pie Chart: Shows distribution (responds to filters)
- Ranking Tables: Show defect counts and DPMO with heat map

HEAT MAP COLORS:
- Red: High defect count (80-100% of max)
- Orange: Moderate (40-79% of max)
- Yellow: Some issues (20-39% of max)
- Green: Few or no defects (0-19% of max)

TIPS:
- Use both slicers together for combined filtering
- The category summary updates as you filter
- Click "Reset Filters" to clear all selections
- "N/A" in DPMO means no packages data found for that employee
`;

  SpreadsheetApp.getUi().alert('Help', helpText, SpreadsheetApp.getUi().ButtonSet.OK);
}
