// Generate year options (from 2025 to current year)
function generateYearOptions() {
    const startYear = 2025;
    const currentYear = new Date().getFullYear();
    let options = '';
    
    // Only show options from 2025 to current year
    const endYear = Math.max(currentYear, startYear);
    for (let year = startYear; year <= endYear; year++) {
        options += `<option value="${year}">${year}</option>`;
    }
    
    return options;
}

// Generate month options
function generateMonthOptions() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 0-based to 1-based
    const selectedYear = parseInt(document.getElementById('yearSelect')?.value || currentYear);
    
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    // If selected year is current year, only show to current month
    // If selected year is 2025, only show from March
    const endMonth = selectedYear === currentYear ? currentMonth : 12;
    const startMonth = selectedYear === 2025 ? 3 : 1;
    
    return months
        .slice(startMonth - 1, endMonth)
        .map((month, index) => 
            `<option value="${index + startMonth}">${month}</option>`
        ).join('');
}

// 2. Expose a function that reads the current selections:
function getSelectedTime() {
    const yearEl  = document.getElementById('yearSelect');
    const monthEl = document.getElementById('monthSelect');
    return {
      year:  yearEl?.value  || new Date().getFullYear().toString(),
      month: monthEl?.value || String(new Date().getMonth() + 1).padStart(2, '0')
    };
  }
  window.getSelectedTime      = getSelectedTime;

// Initialize time selector
async function initializeTimeSelector() {
    try {
        const header = document.querySelector('header');
        if (!header) {
            throw new Error('Header element not found');
        }

        const container = document.createElement('div');
        container.className = 'time-selector';
        container.innerHTML = `
            <div class="selector-container">
                <div class="selector-group">
                    <label for="yearSelect">Year:</label>
                    <select id="yearSelect">
                        ${generateYearOptions()}
                    </select>
                </div>
                <div class="selector-group">
                    <label for="monthSelect">Month:</label>
                    <select id="monthSelect">
                        ${generateMonthOptions()}
                    </select>
                </div>
                <div class="selector-controls">
                    <button onclick="navigateToPrevious()" class="nav-button">Previous</button>
                    <button onclick="navigateToNext()" class="nav-button">Next</button>
                    <button onclick="navigateToCurrent()" class="current-button">Current</button>
                </div>
            </div>
            <div id="period-display"></div>
        `;
        
        // Insert after header
        header.parentNode.insertBefore(container, header.nextSibling);
        
        // 添加事件监听器
        const yearSelect = document.getElementById('yearSelect');
        const monthSelect = document.getElementById('monthSelect');
        
        if (!yearSelect || !monthSelect) {
            throw new Error('Time selector elements not found');
        }

        yearSelect.addEventListener('change', () => {
            updateMonthOptions();
            loadRankingData();
        });
        monthSelect.addEventListener('change', () => loadRankingData());
        
        // 设置默认值
        setDefaultMonth();
        updatePeriodDisplay();
    } catch (error) {
        console.error('Error initializing time selector:', error);
        throw error;
    }
}

// Update month options when year changes
function updateMonthOptions() {
    const monthSelect = document.getElementById('monthSelect');
    if (monthSelect) {
        monthSelect.innerHTML = generateMonthOptions();
        setDefaultMonth();
        updatePeriodDisplay();
    }
}

// Set to default month
function setDefaultMonth() {
    const currentDate = new Date();
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    
    if (yearSelect && monthSelect) {
        yearSelect.value = currentDate.getFullYear();
        monthSelect.value = currentDate.getMonth() + 1;
    }
}

// Update period display
function updatePeriodDisplay() {
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    const display = document.getElementById('period-display');
    
    if (yearSelect && monthSelect && display) {
        const year = yearSelect.value;
        const monthName = monthSelect.options[monthSelect.selectedIndex].text;
        display.textContent = `Currently showing: Rankings for ${monthName} ${year}`;
        display.style.color = 'grey';
        display.style.marginTop = '10px';
        display.style.fontSize = '16px';
    }
}

// Switch to previous month
function navigateToPrevious() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    
    if (monthSelect && yearSelect) {
        let month = parseInt(monthSelect.value);
        let year = parseInt(yearSelect.value);
        
        month--;
        if (month < 1) {
            month = 12;
            year--;
        }
        
        monthSelect.value = month;
        yearSelect.value = year;
        loadRankingData();
    }
}

// Switch to next month
function navigateToNext() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    
    if (monthSelect && yearSelect) {
        let month = parseInt(monthSelect.value);
        let year = parseInt(yearSelect.value);
        
        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
        
        monthSelect.value = month;
        yearSelect.value = year;
        loadRankingData();
    }
}

// Return to current month
function navigateToCurrent() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');
    
    if (monthSelect && yearSelect) {
        const now = new Date();
        monthSelect.value = now.getMonth() + 1;
        yearSelect.value = now.getFullYear();
        loadRankingData();
    }
}

// Get region from URL
function getRegionFromUrl() {
    const path = window.location.pathname;
    // Match patterns like /eor-services-provider-china or /payroll-services-provider-china
    const match = path.match(/(?:eor|payroll)-services-provider-([^/]+)/);
    if (!match) {
        console.error('Could not extract region from URL:', path);
        return '';
    }
    return match[1];
}

// Get service type from URL
function getServiceTypeFromUrl() {
    const path = window.location.pathname;
    // Match patterns like /eor-services-provider-china or /payroll-services-provider-china
    const match = path.match(/(?:eor|payroll)-services-provider/);
    if (!match) {
        console.error('Could not extract service type from URL:', path);
        return '';
    }
    // Extract just the service type (eor or payroll) from the matched string
    return match[0].split('-')[0];
}

// Load ranking data
async function loadRankingData() {
    try {
        // Show loading notice
        const tbody = document.getElementById('rankingsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <div class="spinner"></div>
                            <span>Loading rankings data...</span>
                        </div>
                    </td>
                </tr>
            `;
        }

        const region = getRegionFromUrl();
        const serviceType = getServiceTypeFromUrl();
        const { year, month } = getSelectedTime();
        
        // Validate required parameters
        if (!region || !serviceType) {
            throw new Error('Missing required parameters: region or service type');
        }

        // Use the generate endpoint
        const url = '/api/rankings/generate';
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                region: region,
                serviceType: serviceType,
                year: parseInt(year, 10),
                month: parseInt(month, 10)
            })
        });

        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const response = await res.json();
        console.log('Server response:', response);
        
        // Validate response structure
        if (!response || typeof response !== 'object') {
            throw new Error('Invalid response format from server');
        }

        // Extract and validate rankings data
        let data = [];
        if (Array.isArray(response)) {
            data = response;
        } else if (Array.isArray(response.data)) {
            data = response.data;
        } else if (response.rankings && Array.isArray(response.rankings)) {
            data = response.rankings;
        } else {
            console.error('Unexpected response structure:', response);
            throw new Error('Invalid rankings data format');
        }

        console.log('Processed rankings data:', data);

        // Process and sort the data
        const top10 = data
            .map(row => ({
                rankingPosition: parseInt(row.ranking_position || row.rankingPosition, 10) || 0,
                companyName: row.company_name || row.companyName || '',
                companyDescription: row.company_description || row.companyDescription || '',
                strengths: Array.isArray(row.strengths) ? row.strengths : 
                          (typeof row.strengths === 'string' ? 
                            (() => {
                                try {
                                    return JSON.parse(row.strengths);
                                } catch (e) {
                                    console.warn('Failed to parse strengths:', e);
                                    return [];
                                }
                            })() : []),
                websiteLink: row.website || row.website_link || ''
            }))
            .sort((a, b) => a.rankingPosition - b.rankingPosition)
            .slice(0, 10);

        // Update the table
        if (tbody) {
            tbody.innerHTML = ''; // Clear loading notice

            if (top10.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 20px;">
                            No rankings available for this period.
                        </td>
                    </tr>
                `;
                return;
            }

            top10.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="rank">
                        <span>${row.rankingPosition}</span>
                    </td>
                    <td>${row.companyName}</td>
                    <td>${row.companyDescription}</td>
                    <td class="strengths">
                        <ul>
                            ${row.strengths.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </td>
                    <td>
                        <a class="button" href="${row.websiteLink}" target="_blank" rel="noopener">
                            Visit
                        </a>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        // Update the period display
        updatePeriodDisplay();

    } catch (err) {
        console.error('Error loading rankings:', err);
        const tbody = document.getElementById('rankingsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="error">
                        Unable to load rankings. Please try again later.
                    </td>
                </tr>
            `;
        }
    }
} 