// Nova Analysis - Exact Match to Screenshot
let ws;
let tickHistory = [];
let currentSymbol = 'R_50'; // Volatility 50 Index
let selectedDigit = 3;
let decimalPlaces = 3; // Will be dynamically detected from tick data

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    initializeUI();
    startWebSocket();
});

// Re-render circles on window resize for responsive sizing
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        renderDigitCircles();
        if (tickHistory.length > 0) {
            updateUI();
        }
    }, 250);
});

// Initialize UI
function initializeUI() {
    renderDigitCircles();
    renderDigitSelector();
    updateMarketLabel();
    setupShowMoreButton();
    setupMarketSelector();
}

// Setup market selector
function setupMarketSelector() {
    const selector = document.getElementById('market-selector');
    
    // Set initial value
    selector.value = currentSymbol;
    
    // Handle market change
    selector.addEventListener('change', (e) => {
        const newSymbol = e.target.value;
        if (newSymbol !== currentSymbol) {
            currentSymbol = newSymbol;
            tickHistory = [];
            updateMarketLabel();
            
            // Close existing WebSocket and start new one
            if (ws) {
                ws.close();
            }
            startWebSocket();
            
            console.log('📊 Switched to market:', currentSymbol);
        }
    });
}

// Setup show more button
function setupShowMoreButton() {
    const btn = document.getElementById('show-more-btn');
    let showing = 50;

    btn.addEventListener('click', () => {
        if (showing === 50) {
            showing = 100;
            btn.textContent = 'Show Less (50) →';
        } else {
            showing = 50;
            btn.textContent = 'Show More (100) →';
        }
        updateDigitsStream(showing);
    });
}

// Render digit circles (0-9)
function renderDigitCircles() {
    const container = document.getElementById('digit-circles');
    container.innerHTML = '';

    for (let i = 0; i <= 9; i++) {
        const circle = createDigitCircle(i);
        container.appendChild(circle);
    }
}

// Create a single digit circle with SVG progress ring
function createDigitCircle(digit) {
    const div = document.createElement('div');
    div.className = 'digit-circle';
    div.setAttribute('data-digit', digit);

    // Responsive sizing based on screen width
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    let size, radius, center;
    if (isSmallMobile) {
        size = 45; // 35 * 1.3
        radius = 19.5; // 15 * 1.3
        center = 22.5;
    } else if (isMobile) {
        size = 52; // 40 * 1.3
        radius = 22; // 17 * 1.3
        center = 26;
    } else {
        // Desktop: increased by 20% from 57 (57 * 1.2 = 68.4)
        size = 68;
        radius = 31; // 26 * 1.2
        center = 34;
    }

    const circumference = 2 * Math.PI * radius;

    div.innerHTML = `
        <svg class="circle-svg" width="${size}" height="${size}">
            <circle class="circle-bg" cx="${center}" cy="${center}" r="${radius}"></circle>
            <circle class="circle-progress" cx="${center}" cy="${center}" r="${radius}"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${circumference}"></circle>
        </svg>
        <div class="digit-number">${digit}</div>
        <div class="digit-percentage">0.0%</div>
    `;

    return div;
}

// Render digit selector buttons
function renderDigitSelector() {
    const container = document.getElementById('digit-selector');
    container.innerHTML = '';

    for (let i = 0; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = 'digit-btn';
        btn.textContent = i;
        btn.setAttribute('data-digit', i);

        if (i === selectedDigit) {
            btn.classList.add('active');
        }

        btn.addEventListener('click', () => {
            selectedDigit = i;
            updateDigitSelector();
            updateComparison();
        });

        container.appendChild(btn);
    }
}

// Update digit selector active state
function updateDigitSelector() {
    document.querySelectorAll('.digit-btn').forEach(btn => {
        const digit = parseInt(btn.getAttribute('data-digit'));
        if (digit === selectedDigit) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update selected digit labels
    document.getElementById('selected-digit-over').textContent = selectedDigit;
    document.getElementById('selected-digit-under').textContent = selectedDigit;
    document.getElementById('selected-digit-equal').textContent = selectedDigit;
}

// Update market label
function updateMarketLabel() {
    const marketNames = {
        'R_10': 'Volatility 10 Index',
        'R_25': 'Volatility 25 Index',
        'R_50': 'Volatility 50 Index',
        'R_75': 'Volatility 75 Index',
        'R_100': 'Volatility 100 Index',
        '1HZ10V': 'Volatility 10 (1s) Index',
        '1HZ15V': 'Volatility 15 (1s) Index',
        '1HZ25V': 'Volatility 25 (1s) Index',
        '1HZ30V': 'Volatility 30 (1s) Index',
        '1HZ50V': 'Volatility 50 (1s) Index',
        '1HZ75V': 'Volatility 75 (1s) Index',
        '1HZ90V': 'Volatility 90 (1s) Index',
        '1HZ100V': 'Volatility 100 (1s) Index',
    };

    document.getElementById('market-label').textContent = marketNames[currentSymbol] || currentSymbol;
}

// WebSocket connection
function startWebSocket() {
    ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=125428');

    ws.onopen = () => {
        console.log('✅ Connected to Deriv WebSocket');
        requestTickHistory();
    };

    ws.onmessage = event => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };

    ws.onerror = error => {
        console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('🔌 WebSocket closed, reconnecting...');
        setTimeout(startWebSocket, 3000);
    };
}

// Request tick history
function requestTickHistory() {
    const request = {
        ticks_history: currentSymbol,
        adjust_start_time: 1,
        count: 1000,
        end: 'latest',
        start: 1,
        style: 'ticks',
    };

    ws.send(JSON.stringify(request));
}

// Handle WebSocket messages
function handleWebSocketMessage(data) {
    if (data.msg_type === 'history') {
        // Process historical ticks - store originalQuote like Metatron
        tickHistory = [];
        if (data.history && data.history.times && data.history.prices) {
            console.log('🔍 RAW HISTORY DATA:', {
                firstPrice: data.history.prices[0],
                typeOfFirstPrice: typeof data.history.prices[0],
                last5Prices: data.history.prices.slice(-5)
            });
            
            for (let i = 0; i < data.history.times.length; i++) {
                const price = data.history.prices[i];
                // Store as string to preserve format
                const originalQuote = typeof price === 'string' ? price : String(price);
                tickHistory.push({
                    time: data.history.times[i],
                    quote: parseFloat(price),
                    originalQuote: originalQuote,
                });
            }
        }
        
        // Detect decimal places dynamically from actual tick data
        detectDecimalPlaces();
        
        console.log('📊 Loaded', tickHistory.length, 'historical ticks');
        console.log('🔍 Sample tick structure:', tickHistory[0]);
        console.log('🔍 Last tick structure:', tickHistory[tickHistory.length - 1]);
        
        // Debug: Check digit distribution
        const allDigits = tickHistory.map(t => getLastDigit(t));
        const digitCounts = Array(10).fill(0);
        allDigits.forEach(d => digitCounts[d]++);
        console.log('🔢 DIGIT DISTRIBUTION:', digitCounts);
        console.log('🔢 Digit 0 count:', digitCounts[0], 'out of', tickHistory.length, '=', ((digitCounts[0] / tickHistory.length) * 100).toFixed(1) + '%');
        
        updateUI();
        subscribeToTicks();
    } else if (data.msg_type === 'tick') {
        // Process live tick - store originalQuote like Metatron
        const price = data.tick.quote;
        const originalQuote = typeof price === 'string' ? price : String(price);
        tickHistory.push({
            time: data.tick.epoch,
            quote: parseFloat(price),
            originalQuote: originalQuote,
        });

        // Keep last 1000 ticks
        if (tickHistory.length > 1000) {
            tickHistory.shift();
        }

        updateUI();
    }
}

// Subscribe to live ticks
function subscribeToTicks() {
    const request = {
        ticks: currentSymbol,
        subscribe: 1,
    };
    ws.send(JSON.stringify(request));
}

// Update UI with current data
function updateUI() {
    if (tickHistory.length === 0) return;

    // Update current price - use originalQuote like Metatron
    const lastTick = tickHistory[tickHistory.length - 1];
    const priceStr = lastTick.originalQuote || lastTick.quote.toString();
    document.getElementById('current-price').textContent = priceStr;

    // Calculate digit distribution
    const digitCounts = Array(10).fill(0);
    const lastDigits = [];

    tickHistory.forEach(tick => {
        const digit = getLastDigit(tick);
        digitCounts[digit]++;
        lastDigits.push(digit);
    });

    // Update digit circles
    updateDigitCircles(digitCounts);

    // Update comparison
    updateComparison();

    // Update even/odd pattern
    updateEvenOddPattern();

    // Update market movement
    updateMarketMovement();

    // Update digits stream
    updateDigitsStream(50);
}

// Function to detect the number of decimal places dynamically
function detectDecimalPlaces() {
    if (tickHistory.length === 0) return;

    let decimalCounts = tickHistory.map(tick => {
        let decimalPart = tick.quote.toString().split('.')[1] || '';
        return decimalPart.length;
    });

    decimalPlaces = Math.max(...decimalCounts, 2);
    console.log('🔍 Detected decimal places:', decimalPlaces);
}

// Get last digit from price
function getLastDigit(tick) {
    // Use original quote string if available, otherwise convert number to string
    let priceStr;
    if (typeof tick === 'object' && tick.originalQuote) {
        priceStr = tick.originalQuote;
    } else if (typeof tick === 'object' && tick.quote !== undefined) {
        priceStr = tick.quote.toString();
    } else {
        priceStr = tick.toString();
    }

    // Ensure priceStr is always a string
    if (typeof priceStr !== 'string') {
        priceStr = String(priceStr);
    }

    let priceParts = priceStr.split('.');
    let decimals = priceParts[1] || '';

    // Pad with zeros to match expected decimal places (dynamically detected)
    while (decimals.length < decimalPlaces) {
        decimals += '0';
    }

    // Get the last digit from the decimal part
    const lastDigit = Number(decimals.slice(-1));

    // Debug logging for digit 0
    if (lastDigit === 0 && Math.random() < 0.05) {
        console.log(`🔍 Digit 0 found: "${priceStr}" -> decimals: "${decimals}" (padded to ${decimalPlaces}) -> lastDigit: ${lastDigit}`);
    }

    return lastDigit;
}

// Update digit circles with percentages and progress rings
function updateDigitCircles(digitCounts) {
    const total = digitCounts.reduce((a, b) => a + b, 0);
    if (total === 0) return;

    let highestDigit = 0;
    let lowestDigit = 0;
    let highestCount = digitCounts[0];
    let lowestCount = digitCounts[0];

    // Find highest and lowest counts first
    digitCounts.forEach((count, digit) => {
        if (count > highestCount) {
            highestCount = count;
            highestDigit = digit;
        }
        if (count < lowestCount) {
            lowestCount = count;
            lowestDigit = digit;
        }
    });

    // Get current last digit
    const currentLastDigit = tickHistory.length > 0 ? getLastDigit(tickHistory[tickHistory.length - 1]) : null;

    digitCounts.forEach((count, digit) => {
        const percentage = ((count / total) * 100).toFixed(1);
        const circle = document.querySelector(`.digit-circle[data-digit="${digit}"]`);

        if (circle) {
            // Remove active class from all circles first
            circle.classList.remove('active');

            // Add active class to current last digit
            if (digit === currentLastDigit) {
                circle.classList.add('active');
            }

            // Update percentage text
            const percentageEl = circle.querySelector('.digit-percentage');
            percentageEl.textContent = `${percentage}%`;

            // Update progress ring with color based on frequency
            const progressCircle = circle.querySelector('.circle-progress');
            
            // Get radius from the actual SVG circle element
            const svgCircle = circle.querySelector('.circle-progress');
            const radius = parseFloat(svgCircle.getAttribute('r')) || 34;
            
            const circumference = 2 * Math.PI * radius;
            
            // Set fixed ring lengths for highest and lowest
            let displayPercentage = parseFloat(percentage);
            let ringColor;
            
            if (digit === highestDigit) {
                ringColor = '#10b981'; // Green
                displayPercentage = 75; // Fixed at 75% of circumference
            } else if (digit === lowestDigit) {
                ringColor = '#ef4444'; // Red
                displayPercentage = 60; // Fixed at 60% of circumference
            } else {
                ringColor = '#a855f7'; // Purple
                // Keep actual percentage for purple rings
            }
            
            const offset = circumference - (displayPercentage / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
            progressCircle.style.stroke = ringColor;
        }
    });

    // Update highest/lowest display
    const highestPercentage = ((highestCount / total) * 100).toFixed(1);
    const lowestPercentage = ((lowestCount / total) * 100).toFixed(1);

    document.getElementById('highest-digit').textContent = `${highestDigit} (${highestPercentage}%)`;
    document.getElementById('lowest-digit').textContent = `${lowestDigit} (${lowestPercentage}%)`;
}

// Update comparison section
function updateComparison() {
    if (tickHistory.length === 0) return;

    const lastDigits = tickHistory.map(tick => getLastDigit(tick));
    const total = lastDigits.length;

    let overCount = 0;
    let underCount = 0;
    let equalCount = 0;

    lastDigits.forEach(digit => {
        if (digit > selectedDigit) {
            overCount++;
        } else if (digit < selectedDigit) {
            underCount++;
        } else {
            equalCount++;
        }
    });

    const overPercentage = ((overCount / total) * 100).toFixed(1);
    const underPercentage = ((underCount / total) * 100).toFixed(1);
    const equalPercentage = ((equalCount / total) * 100).toFixed(1);

    document.getElementById('over-value').textContent = `${overPercentage}%`;
    document.getElementById('under-value').textContent = `${underPercentage}%`;
    document.getElementById('equal-value').textContent = `${equalPercentage}%`;
}

// Update even/odd pattern
function updateEvenOddPattern() {
    if (tickHistory.length === 0) return;

    const lastDigits = tickHistory.map(tick => getLastDigit(tick));
    const last50 = lastDigits.slice(-50);

    let evenCount = 0;
    let oddCount = 0;

    last50.forEach(digit => {
        if (digit % 2 === 0) {
            evenCount++;
        } else {
            oddCount++;
        }
    });

    const total = last50.length;
    const evenPercentage = ((evenCount / total) * 100).toFixed(1);
    const oddPercentage = ((oddCount / total) * 100).toFixed(1);

    document.getElementById('even-percentage').textContent = `${evenPercentage}%`;
    document.getElementById('odd-percentage').textContent = `${oddPercentage}%`;

    // Render pattern stream
    const container = document.getElementById('pattern-stream');
    container.innerHTML = '';

    last50.forEach(digit => {
        const badge = document.createElement('div');
        badge.className = `pattern-badge ${digit % 2 === 0 ? 'even' : 'odd'}`;
        badge.textContent = digit % 2 === 0 ? 'E' : 'O';
        container.appendChild(badge);
    });
}

// Update market movement (Rise/Fall)
function updateMarketMovement() {
    if (tickHistory.length < 2) return;

    let riseCount = 0;
    let fallCount = 0;

    for (let i = 1; i < tickHistory.length; i++) {
        if (tickHistory[i].quote > tickHistory[i - 1].quote) {
            riseCount++;
        } else if (tickHistory[i].quote < tickHistory[i - 1].quote) {
            fallCount++;
        }
    }

    const total = riseCount + fallCount;
    const risePercentage = total > 0 ? ((riseCount / total) * 100).toFixed(1) : '0.0';
    const fallPercentage = total > 0 ? ((fallCount / total) * 100).toFixed(1) : '0.0';

    document.getElementById('rise-percentage').textContent = `${risePercentage}%`;
    document.getElementById('fall-percentage').textContent = `${fallPercentage}%`;
}

// Update digits stream
function updateDigitsStream(count = 50) {
    if (tickHistory.length === 0) return;

    const lastDigits = tickHistory.map(tick => getLastDigit(tick));
    const displayDigits = lastDigits.slice(-count);

    const container = document.getElementById('digits-stream');
    container.innerHTML = '';

    displayDigits.forEach(digit => {
        const badge = document.createElement('div');
        badge.className = `digit-badge ${digit % 2 === 0 ? 'even' : 'odd'}`;
        badge.textContent = digit;
        container.appendChild(badge);
    });
}

console.log('✨ Nova Analysis initialized');
