// rabbit browser Search engine

let tabCounter = 1;
let activeTab = 1;
let tabData = {};
let isIncognito = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeSearchEngine();
    setupEventListeners();
    loadNHPDatabase();
});

// Initialize the search engine
function initializeSearchEngine() {
    tabData[1] = {
        mode: 'search',
        searchQuery: '',
        results: []
    };
}

// Setup all event listeners
function setupEventListeners() {
    // Search functionality
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchAction').addEventListener('click', performSearch);
    document.getElementById('luckyBtn').addEventListener('click', feelingLucky);
    
    // Results page search
    document.getElementById('resultsSearchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    document.getElementById('resultsSearchBtn').addEventListener('click', performSearch);
    document.getElementById('resultsLogo').addEventListener('click', goToSearchPage);
    
    // Tab management
    document.getElementById('newTabBtn').addEventListener('click', createNewTab);
    
    // Incognito mode
    document.getElementById('incognitoBtn').addEventListener('click', toggleIncognito);
    
    // NHP DB Compiler
    document.getElementById('nhpLogo').addEventListener('click', openCompiler);
    document.getElementById('closeCompiler').addEventListener('click', closeCompiler);
    document.getElementById('runDbCode').addEventListener('click', runNHPCode);
    document.getElementById('clearDbCode').addEventListener('click', clearNHPCode);
    
    // Safety warning
    document.getElementById('goBack').addEventListener('click', function() {
        document.getElementById('safetyWarning').classList.add('hidden');
    });
    
    document.getElementById('continueAnyway').addEventListener('click', function() {
        document.getElementById('safetyWarning').classList.add('hidden');
        // Continue to the URL anyway
    });
    
    // Search suggestions
    document.getElementById('searchInput').addEventListener('input', showSuggestions);
}

// Perform web search
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const resultsSearchInput = document.getElementById('resultsSearchInput');
    const query = searchInput.value.trim() || resultsSearchInput.value.trim();
    
    if (!query) return;
    
    // Update both search inputs
    searchInput.value = query;
    resultsSearchInput.value = query;
    
    // Hide search page, show results page
    const currentContent = document.querySelector('.search-page[data-content="' + activeTab + '"]');
    const resultsContent = document.querySelector('.results-page[data-content="' + activeTab + '"]');
    
    if (currentContent) currentContent.classList.remove('active');
    if (resultsContent) resultsContent.classList.add('active');
    
    // Update tab title
    updateTabTitle(query);
    
    // Fetch and display results
    fetchSearchResults(query);
}

// Fetch search results (simulated - in real app, this would call a backend API)
async function fetchSearchResults(query) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '<div style="text-align: center; padding: 40px;"><h2>Searching for: ' + escapeHtml(query) + '</h2><p>Loading results...</p></div>';
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate mock results with relevant images
    const results = generateMockResults(query);
    displayResults(results);
}

// Generate mock search results
function generateMockResults(query) {
    const results = [];
    const topics = extractTopics(query);
    
    for (let i = 0; i < 10; i++) {
        results.push({
            url: `https://example${i + 1}.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
            title: `${topics[0] || 'Information'} about ${query} - Result ${i + 1}`,
            description: `This page contains comprehensive information about ${query}. Learn more about ${topics.join(', ')} and related topics. Updated recently with the latest information.`,
            image: topics[0] ? `https://via.placeholder.com/150?text=${encodeURIComponent(topics[0])}` : null
        });
    }
    
    return results;
}

// Extract topics from search query
function extractTopics(query) {
    const words = query.toLowerCase().split(/\s+/);
    return words.filter(word => word.length > 3);
}

// Display search results
function displayResults(results) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';
    
    results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        resultItem.innerHTML = `
            <div class="result-url">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 8px;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${escapeHtml(result.url)}
            </div>
            <div class="result-title" onclick="openURL('${result.url}')">${escapeHtml(result.title)}</div>
            <div class="result-description">${escapeHtml(result.description)}</div>
            ${result.image ? `<img src="${result.image}" alt="Related image" class="result-image">` : ''}
        `;
        
        resultsContainer.appendChild(resultItem);
    });
}

// Open URL with safety check
function openURL(url) {
    // Check URL safety first
    if (checkURLSafety(url)) {
        window.open(url, '_blank');
    } else {
        showSafetyWarning(url);
    }
}

// Show URL safety warning
function showSafetyWarning(url) {
    const warningModal = document.getElementById('safetyWarning');
    const warningMessage = document.getElementById('warningMessage');
    
    warningMessage.textContent = `The URL "${url}" may be dangerous or contain malware. Proceed with caution.`;
    warningModal.classList.remove('hidden');
}

// Feeling Lucky - go to first result
function feelingLucky() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    
    // In a real implementation, this would go to the first search result
    const firstURL = `https://www.google.com/search?btnI=1&q=${encodeURIComponent(query)}`;
    window.open(firstURL, '_blank');
}

// Show search suggestions
function showSuggestions() {
    const input = document.getElementById('searchInput');
    const query = input.value.trim();
    const suggestionsDiv = document.getElementById('suggestions');
    
    if (query.length < 2) {
        suggestionsDiv.classList.add('hidden');
        return;
    }
    
    // Generate mock suggestions
    const suggestions = [
        `${query} tutorial`,
        `${query} meaning`,
        `${query} examples`,
        `what is ${query}`,
        `${query} vs alternatives`
    ];
    
    suggestionsDiv.innerHTML = '';
    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-right: 12px;">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
            </svg>
            ${escapeHtml(suggestion)}
        `;
        item.onclick = function() {
            input.value = suggestion;
            suggestionsDiv.classList.add('hidden');
            performSearch();
        };
        suggestionsDiv.appendChild(item);
    });
    
    suggestionsDiv.classList.remove('hidden');
}

// Go back to search page
function goToSearchPage() {
    const searchPage = document.querySelector('.search-page[data-content="' + activeTab + '"]');
    const resultsPage = document.querySelector('.results-page[data-content="' + activeTab + '"]');
    
    if (resultsPage) resultsPage.classList.remove('active');
    if (searchPage) searchPage.classList.add('active');
}

// Tab Management
function createNewTab() {
    tabCounter++;
    const tabId = tabCounter;
    
    // Create new tab element
    const tabsContainer = document.getElementById('tabsContainer');
    const newTab = document.createElement('div');
    newTab.className = 'tab';
    newTab.setAttribute('data-tab', tabId);
    newTab.innerHTML = `
        <span class="tab-title">New Tab</span>
        <button class="tab-close">×</button>
    `;
    
    // Add click event to switch tabs
    newTab.addEventListener('click', function(e) {
        if (!e.target.classList.contains('tab-close')) {
            switchTab(tabId);
        }
    });
    
    // Add close button event
    newTab.querySelector('.tab-close').addEventListener('click', function(e) {
        e.stopPropagation();
        closeTab(tabId);
    });
    
    tabsContainer.appendChild(newTab);
    
    // Create new content areas
    createContentAreas(tabId);
    
    // Initialize tab data
    tabData[tabId] = {
        mode: 'search',
        searchQuery: '',
        results: []
    };
    
    // Switch to new tab
    switchTab(tabId);
}

// Create content areas for new tab
function createContentAreas(tabId) {
    const mainContent = document.getElementById('mainContent');
    
    // Clone search page
    const searchPage = document.querySelector('.search-page').cloneNode(true);
    searchPage.setAttribute('data-content', tabId);
    searchPage.classList.remove('active');
    mainContent.appendChild(searchPage);
    
    // Clone results page
    const resultsPage = document.querySelector('.results-page').cloneNode(true);
    resultsPage.setAttribute('data-content', tabId);
    resultsPage.classList.remove('active');
    mainContent.appendChild(resultsPage);
}

// Switch to a different tab
function switchTab(tabId) {
    // Update active tab marker
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector('.tab[data-tab="' + tabId + '"]').classList.add('active');
    
    // Hide all content, show active tab content
    document.querySelectorAll('.search-page, .results-page').forEach(content => {
        content.classList.remove('active');
    });
    
    const tabInfo = tabData[tabId];
    if (tabInfo.mode === 'search') {
        document.querySelector('.search-page[data-content="' + tabId + '"]').classList.add('active');
    } else {
        document.querySelector('.results-page[data-content="' + tabId + '"]').classList.add('active');
    }
    
    activeTab = tabId;
}

// Close a tab
function closeTab(tabId) {
    const tab = document.querySelector('.tab[data-tab="' + tabId + '"]');
    const tabs = document.querySelectorAll('.tab');
    
    // Don't close if it's the only tab
    if (tabs.length === 1) {
        // Reset the tab instead
        tabData[tabId] = { mode: 'search', searchQuery: '', results: [] };
        switchTab(tabId);
        goToSearchPage();
        return;
    }
    
    // If closing active tab, switch to another tab first
    if (activeTab === tabId) {
        const index = Array.from(tabs).indexOf(tab);
        const nextTab = tabs[index + 1] || tabs[index - 1];
        switchTab(parseInt(nextTab.getAttribute('data-tab')));
    }
    
    // Remove tab and its content
    tab.remove();
    document.querySelector('.search-page[data-content="' + tabId + '"]').remove();
    document.querySelector('.results-page[data-content="' + tabId + '"]').remove();
    delete tabData[tabId];
}

// Update tab title based on search query
function updateTabTitle(query) {
    const activeTabElement = document.querySelector('.tab[data-tab="' + activeTab + '"]');
    const titleElement = activeTabElement.querySelector('.tab-title');
    titleElement.textContent = query.substring(0, 30) + (query.length > 30 ? '...' : '');
    
    if (tabData[activeTab]) {
        tabData[activeTab].mode = 'results';
        tabData[activeTab].searchQuery = query;
    }
}

// Toggle Incognito Mode
function toggleIncognito() {
    isIncognito = !isIncognito;
    document.body.classList.toggle('incognito', isIncognito);
    
    const btn = document.getElementById('incognitoBtn');
    btn.textContent = isIncognito ? '🕵️ Exit Incognito' : '🕵️ Incognito';
    btn.style.background = isIncognito ? '#5f6368' : '#4285f4';
}

// NHP DB Compiler Functions
let nhpDatabase = null;

function loadNHPDatabase() {
    // Initialize NHP Database (simulated)
    nhpDatabase = {
        customers: [
            { name: 'Rahul', country: 'India', city: 'Mumbai', age: 25 },
            { name: 'Alice', country: 'USA', city: 'New York', age: 30 },
            { name: 'Wang Li', country: 'China', city: 'Beijing', age: 28 },
            { name: 'Carlos', country: 'Brazil', city: 'Sao Paulo', age: 35 },
            { name: 'Priya', country: 'India', city: 'Delhi', age: 22 },
            { name: 'James', country: 'UK', city: 'London', age: 40 },
            { name: 'Fatima', country: 'UAE', city: 'Dubai', age: 27 },
            { name: 'Yuki', country: 'Japan', city: 'Tokyo', age: 33 }
        ],
        sellers: [
            { food: 'Pizza', price: 250, stock: 50 },
            { food: 'Burger', price: 120, stock: 80 },
            { food: 'Biryani', price: 180, stock: 30 },
            { food: 'Pasta', price: 200, stock: 45 },
            { food: 'Dosa', price: 60, stock: 100 },
            { food: 'Sushi', price: 350, stock: 20 },
            { food: 'Tacos', price: 150, stock: 60 },
            { food: 'Noodles', price: 90, stock: 75 }
        ]
    };
}

function openCompiler() {
    document.getElementById('compilerModal').classList.remove('hidden');
}

function closeCompiler() {
    document.getElementById('compilerModal').classList.add('hidden');
}

function clearNHPCode() {
    document.getElementById('dbCodeInput').value = '';
    document.getElementById('dbOutput').textContent = 'Ready to execute NHPLang queries...';
}

function runNHPCode() {
    const code = document.getElementById('dbCodeInput').value.trim();
    const output = document.getElementById('dbOutput');
    
    if (!code) {
        output.textContent = 'Error: No code to execute!';
        return;
    }
    
    try {
        const result = executeNHPQuery(code);
        output.textContent = result;
    } catch (error) {
        output.textContent = 'Error: ' + error.message;
    }
}

function executeNHPQuery(query) {
    const lines = query.split('\n').map(line => line.trim()).filter(line => line);
    let result = '';
    let currentTable = null;
    let columns = [];
    let sortOrder = null;
    
    for (const line of lines) {
        // Parse: Select * From Customers;
        if (line.toLowerCase().startsWith('select')) {
            const match = line.match(/from\s+(\w+)/i);
            if (match) {
                currentTable = match[1].toLowerCase();
            }
        }
        // Parse: Country + City
        else if (line.includes('+')) {
            columns = line.split('+').map(col => col.trim().toLowerCase());
        }
        // Parse: Food("Price/Mrp") Low_high
        else if (line.toLowerCase().includes('low_high')) {
            sortOrder = 'asc';
        } else if (line.toLowerCase().includes('high_low')) {
            sortOrder = 'desc';
        }
    }
    
    if (!currentTable) {
        return 'Error: No table specified. Use: Select * From Customers; or Select * From Seller;';
    }
    
    // Execute query
    if (currentTable === 'customers') {
        result = formatCustomersResult(nhpDatabase.customers, columns);
    } else if (currentTable === 'seller' || currentTable === 'sellers') {
        result = formatSellersResult(nhpDatabase.sellers, sortOrder);
    } else {
        return 'Error: Unknown table "' + currentTable + '"';
    }
    
    return result;
}

function formatCustomersResult(customers, columns) {
    let output = '================================================\n';
    output += 'Customers Table\n';
    output += '================================================\n\n';
    
    if (columns.length === 0) {
        // Show all columns
        output += 'Name            | Country         | City            | Age\n';
        output += '------------------------------------------------\n';
        customers.forEach(c => {
            output += padString(c.name, 16) + '| ';
            output += padString(c.country, 16) + '| ';
            output += padString(c.city, 16) + '| ';
            output += c.age + '\n';
        });
    } else if (columns.includes('country') && columns.includes('city')) {
        output += 'Country         | City\n';
        output += '------------------------------------------------\n';
        customers.forEach(c => {
            output += padString(c.country, 16) + '| ' + c.city + '\n';
        });
    } else if (columns.includes('name') && columns.includes('age')) {
        output += 'Name            | Age\n';
        output += '------------------------------------------------\n';
        customers.forEach(c => {
            output += padString(c.name, 16) + '| ' + c.age + '\n';
        });
    }
    
    output += '------------------------------------------------\n';
    output += 'Rows found: ' + customers.length + '\n';
    return output;
}

function formatSellersResult(sellers, sortOrder) {
    let output = '================================================\n';
    output += 'Seller Table\n';
    output += '================================================\n\n';
    
    let data = [...sellers];
    
    if (sortOrder === 'asc') {
        data.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'desc') {
        data.sort((a, b) => b.price - a.price);
    }
    
    output += 'Food            | Price(MRP)      | Stock\n';
    output += '------------------------------------------------\n';
    data.forEach(s => {
        output += padString(s.food, 16) + '| ';
        output += 'Rs.' + padString(String(s.price), 13) + '| ';
        output += s.stock + '\n';
    });
    
    output += '------------------------------------------------\n';
    output += 'Rows found: ' + data.length + '\n';
    return output;
}

function padString(str, length) {
    return (str + ' '.repeat(length)).substring(0, length);
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export functions for use in other modules
window.openURL = openURL;
window.performSearch = performSearch;
