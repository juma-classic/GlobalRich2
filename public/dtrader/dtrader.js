// DTrader Manual Trading JavaScript
console.log('🎯 DTrader Manual Trading Loaded');

// State
let tickHistory = [];
let digitCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let totalTicks = 0;
let basePrice = 1787.34;
let currentPrice = basePrice;
let selectedDigit = 5; // Default selected digit
let numTicks = 5; // Default number of ticks
let stakeAmount = 10.00; // Default stake amount
let tradeType = 'Over/Under'; // Default trade type
let selectedMarket = {
    name: 'Volatility 100 (1s) Index',
    symbol: '1HZ100V',
    icon: '1s',
    basePrice: 1787.34
};

// Available markets
const markets = [
    { name: 'Volatility 10 (1s) Index', symbol: '1HZ10V', icon: '1s', basePrice: 892.45 },
    { name: 'Volatility 15 (1s) Index', symbol: '1HZ15V', icon: '1s', basePrice: 1045.23 },
    { name: 'Volatility 25 (1s) Index', symbol: '1HZ25V', icon: '1s', basePrice: 1234.67 },
    { name: 'Volatility 50 (1s) Index', symbol: '1HZ50V', icon: '1s', basePrice: 1456.89 },
    { name: 'Volatility 75 (1s) Index', symbol: '1HZ75V', icon: '1s', basePrice: 1678.23 },
    { name: 'Volatility 90 (1s) Index', symbol: '1HZ90V', icon: '1s', basePrice: 1723.56 },
    { name: 'Volatility 100 (1s) Index', symbol: '1HZ100V', icon: '1s', basePrice: 1787.34 },
    { name: 'Volatility 150 (1s) Index', symbol: '1HZ150V', icon: '1s', basePrice: 2345.78 },
    { name: 'Volatility 250 (1s) Index', symbol: '1HZ250V', icon: '1s', basePrice: 3456.12 },
    { name: 'Volatility 10 Index', symbol: 'R_10', icon: 'V10', basePrice: 945.23 },
    { name: 'Volatility 25 Index', symbol: 'R_25', icon: 'V25', basePrice: 1289.45 },
    { name: 'Volatility 50 Index', symbol: 'R_50', icon: 'V50', basePrice: 1523.67 },
    { name: 'Volatility 75 Index', symbol: 'R_75', icon: 'V75', basePrice: 1734.89 },
    { name: 'Volatility 100 Index', symbol: 'R_100', icon: 'V100', basePrice: 1856.12 }
];

// Available trade types
const tradeTypes = [
    { name: 'Over/Under', icon: '📊' },
    { name: 'Even/Odd', icon: '🎲' },
    { name: 'Matches/Differs', icon: '🎯' },
    { name: 'Rise/Fall', icon: '📈' }
];

// Calculate payout based on stake and probability
function calculatePayout(stake, isOver) {
    // Simple payout calculation (can be adjusted for realism)
    const overMultiplier = 1.95;
    const underMultiplier = 1.85;
    const multiplier = isOver ? overMultiplier : underMultiplier;
    return (stake * multiplier).toFixed(2);
}

// Update payout displays
function updatePayouts() {
    const overPayout = calculatePayout(stakeAmount, true);
    const underPayout = calculatePayout(stakeAmount, false);
    
    const overPayoutEl = document.querySelector('.trade-btn.over .payout-value');
    const underPayoutEl = document.querySelector('.trade-btn.under .payout-value');
    
    if (overPayoutEl) overPayoutEl.textContent = `${overPayout} AUD`;
    if (underPayoutEl) underPayoutEl.textContent = `${underPayout} AUD`;
}

// Handle ticks controls
const ticksInput = document.getElementById('ticksInput');
const ticksMinus = document.getElementById('ticksMinus');
const ticksPlus = document.getElementById('ticksPlus');

if (ticksInput) {
    ticksInput.addEventListener('change', function() {
        let value = parseInt(this.value);
        if (isNaN(value) || value < 1) value = 1;
        if (value > 10) value = 10;
        this.value = value;
        numTicks = value;
    });
}

if (ticksMinus) {
    ticksMinus.addEventListener('click', function() {
        if (numTicks > 1) {
            numTicks--;
            ticksInput.value = numTicks;
        }
    });
}

if (ticksPlus) {
    ticksPlus.addEventListener('click', function() {
        if (numTicks < 10) {
            numTicks++;
            ticksInput.value = numTicks;
        }
    });
}

// Handle stake controls
const stakeInput = document.getElementById('stakeInput');
const stakeMinus = document.getElementById('stakeMinus');
const stakePlus = document.getElementById('stakePlus');

if (stakeInput) {
    stakeInput.addEventListener('change', function() {
        let value = parseFloat(this.value);
        if (isNaN(value) || value < 0.35) value = 0.35;
        this.value = value.toFixed(2);
        stakeAmount = value;
        updatePayouts();
    });
}

if (stakeMinus) {
    stakeMinus.addEventListener('click', function() {
        if (stakeAmount > 0.35) {
            stakeAmount = Math.max(0.35, stakeAmount - 0.50);
            stakeInput.value = stakeAmount.toFixed(2);
            updatePayouts();
        }
    });
}

if (stakePlus) {
    stakePlus.addEventListener('click', function() {
        stakeAmount += 0.50;
        stakeInput.value = stakeAmount.toFixed(2);
        updatePayouts();
    });
}

// Generate realistic price tick
function generateTick() {
    // Random walk with slight upward bias
    const change = (Math.random() - 0.48) * 2;
    currentPrice = Math.max(basePrice * 0.95, Math.min(basePrice * 1.05, currentPrice + change));
    return parseFloat(currentPrice.toFixed(2));
}

// Get last digit of price
function getLastDigit(price) {
    const priceStr = price.toFixed(2);
    return parseInt(priceStr[priceStr.length - 1]);
}

// Update price display
function updatePriceDisplay() {
    const priceValue = document.querySelector('.price-value');
    const priceChange = document.querySelector('.price-change');
    const priceArrow = document.querySelector('.price-arrow path');
    
    if (priceValue && priceChange) {
        const change = currentPrice - basePrice;
        const changePercent = ((change / basePrice) * 100).toFixed(2);
        
        priceValue.textContent = currentPrice.toFixed(2);
        priceChange.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent}%)`;
        priceChange.classList.toggle('negative', change < 0);
        
        if (priceArrow) {
            if (change >= 0) {
                priceArrow.setAttribute('d', 'M6 3L2 7h8z');
            } else {
                priceArrow.setAttribute('d', 'M6 9L2 5h8z');
            }
        }
    }
}

// Add new tick
function addTick(price) {
    const lastDigit = getLastDigit(price);
    
    // Update digit counts
    digitCounts[lastDigit]++;
    totalTicks++;
    
    // Update digit statistics
    updateDigitStatistics();
    
    // Highlight current digit
    highlightCurrentDigit(lastDigit);
}

// Highlight current digit in statistics
function highlightCurrentDigit(digit) {
    // Remove all previous indicators
    document.querySelectorAll('.digit-circle').forEach(circle => {
        circle.classList.remove('active');
    });
    
    // Add indicator to current digit
    const digitCircles = document.querySelectorAll('.digit-circle');
    if (digitCircles[digit]) {
        digitCircles[digit].classList.add('active');
        
        // Keep visible longer
        setTimeout(() => {
            digitCircles[digit].classList.remove('active');
        }, 1000);
    }
}

// Update digit statistics display
function updateDigitStatistics() {
    const digitCircles = document.querySelectorAll('.digit-circle');
    
    digitCircles.forEach((circle, digit) => {
        const percentage = totalTicks > 0 ? ((digitCounts[digit] / totalTicks) * 100).toFixed(1) : 10;
        const percentageEl = circle.querySelector('.digit-percentage');
        const circleFill = circle.querySelector('.circle-fill');
        
        if (percentageEl) {
            percentageEl.textContent = `${percentage}%`;
        }
        
        if (circleFill) {
            circleFill.setAttribute('stroke-dasharray', `${percentage}, 100`);
            
            // Remove all color classes first
            circleFill.classList.remove('low', 'high', 'active');
            
            // Color based on percentage
            if (percentage >= 11) {
                circleFill.classList.add('high');
            } else if (percentage <= 9) {
                circleFill.classList.add('low');
            }
        }
    });
}

// Generate new tick
function generateNewTick() {
    const newPrice = generateTick();
    addTick(newPrice);
    updatePriceDisplay();
}

// Handle digit selector button clicks
document.querySelectorAll('.digit-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const digit = parseInt(this.textContent);
        selectedDigit = digit;
        
        // Update active state
        document.querySelectorAll('.digit-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        console.log(`Selected digit: ${digit}`);
    });
});

// Handle trade button clicks
document.querySelectorAll('.trade-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const isFirstButton = this.classList.contains('over');
        let type, prediction;
        
        // Determine trade type and prediction
        if (tradeType === 'Over/Under') {
            type = isFirstButton ? 'Over' : 'Under';
            prediction = `${type} ${selectedDigit}`;
        } else if (tradeType === 'Even/Odd') {
            type = isFirstButton ? 'Even' : 'Odd';
            prediction = type;
        } else if (tradeType === 'Matches/Differs') {
            type = isFirstButton ? 'Matches' : 'Differs';
            prediction = `${type} ${selectedDigit}`;
        } else if (tradeType === 'Rise/Fall') {
            type = isFirstButton ? 'Rise' : 'Fall';
            prediction = type;
        }
        
        console.log(`🎲 Placing ${type} trade`);
        
        // Visual feedback
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 100);
        
        // Get current values
        const stake = stakeAmount.toFixed(2);
        const payout = isFirstButton ? calculatePayout(stakeAmount, true) : calculatePayout(stakeAmount, false);
        
        // Show success message
        const message = `✅ Trade Placed Successfully!\n\nType: ${tradeType}\nPrediction: ${prediction}\nStake: ${stake} AUD\nPotential Payout: ${payout} AUD\n\nWaiting for ${numTicks} ticks...`;
        alert(message);
        
        // Simulate trade result after specified ticks
        const waitTime = numTicks * 1000; // 1 second per tick
        setTimeout(() => {
            const lastDigit = getLastDigit(currentPrice);
            let won = false;
            
            // Determine win/loss based on trade type
            if (tradeType === 'Over/Under') {
                if (isFirstButton) {
                    won = lastDigit > selectedDigit;
                } else {
                    won = lastDigit < selectedDigit;
                }
            } else if (tradeType === 'Even/Odd') {
                const isEven = lastDigit % 2 === 0;
                won = isFirstButton ? isEven : !isEven;
            } else if (tradeType === 'Matches/Differs') {
                const matches = lastDigit === selectedDigit;
                won = isFirstButton ? matches : !matches;
            } else if (tradeType === 'Rise/Fall') {
                // For Rise/Fall, compare with previous price
                const previousPrice = currentPrice - (Math.random() - 0.5) * 2;
                const rose = currentPrice > previousPrice;
                won = isFirstButton ? rose : !rose;
            }
            
            if (won) {
                alert(`🎉 Congratulations! You won!\n\nLast digit: ${lastDigit}\nYour prediction: ${prediction}\nPayout: ${payout} AUD`);
            } else {
                alert(`😔 Trade lost\n\nLast digit: ${lastDigit}\nYour prediction: ${prediction}\nBetter luck next time!`);
            }
        }, waitTime);
    });
});

// Handle navigation arrows
document.querySelectorAll('.nav-arrow').forEach(arrow => {
    arrow.addEventListener('click', function() {
        const tickStream = document.getElementById('tickStream');
        if (!tickStream) return;
        
        const scrollAmount = 200;
        if (this.classList.contains('left')) {
            tickStream.scrollLeft -= scrollAmount;
        } else {
            tickStream.scrollLeft += scrollAmount;
        }
    });
});

// Handle market dropdown
const marketDropdown = document.querySelector('.market-dropdown');
if (marketDropdown) {
    marketDropdown.addEventListener('click', function() {
        console.log('Market selector clicked');
        
        // Create modal for market selection
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 24px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        let html = '<h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #1f2937;">Select Market</h3>';
        
        // Group markets by type
        const oneSecondMarkets = markets.filter(m => m.name.includes('(1s)'));
        const regularMarkets = markets.filter(m => !m.name.includes('(1s)'));
        
        html += '<div style="margin-bottom: 20px;"><h4 style="font-size: 14px; font-weight: 600; color: #6b7280; margin: 0 0 12px 0;">1-Second Volatility Indices</h4>';
        oneSecondMarkets.forEach(market => {
            const isSelected = market.symbol === selectedMarket.symbol;
            html += `
                <div class="market-option" data-symbol="${market.symbol}" style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border: 2px solid ${isSelected ? '#2563eb' : '#e5e7eb'};
                    border-radius: 6px;
                    margin-bottom: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: ${isSelected ? '#eff6ff' : 'white'};
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        background: #1f2937;
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 11px;
                        font-weight: 700;
                    ">${market.icon}</div>
                    <div style="flex: 1;">
                        <div style="font-size: 14px; font-weight: 600; color: #1f2937;">${market.name}</div>
                        <div style="font-size: 12px; color: #6b7280;">${market.basePrice.toFixed(2)}</div>
                    </div>
                    ${isSelected ? '<span style="color: #2563eb; font-size: 20px;">✓</span>' : ''}
                </div>
            `;
        });
        html += '</div>';
        
        html += '<div><h4 style="font-size: 14px; font-weight: 600; color: #6b7280; margin: 0 0 12px 0;">Standard Volatility Indices</h4>';
        regularMarkets.forEach(market => {
            const isSelected = market.symbol === selectedMarket.symbol;
            html += `
                <div class="market-option" data-symbol="${market.symbol}" style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border: 2px solid ${isSelected ? '#2563eb' : '#e5e7eb'};
                    border-radius: 6px;
                    margin-bottom: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: ${isSelected ? '#eff6ff' : 'white'};
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        background: #1f2937;
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 10px;
                        font-weight: 700;
                    ">${market.icon}</div>
                    <div style="flex: 1;">
                        <div style="font-size: 14px; font-weight: 600; color: #1f2937;">${market.name}</div>
                        <div style="font-size: 12px; color: #6b7280;">${market.basePrice.toFixed(2)}</div>
                    </div>
                    ${isSelected ? '<span style="color: #2563eb; font-size: 20px;">✓</span>' : ''}
                </div>
            `;
        });
        html += '</div>';
        
        modalContent.innerHTML = html;
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Handle market selection
        modalContent.querySelectorAll('.market-option').forEach(option => {
            option.addEventListener('mouseenter', function() {
                const symbol = this.dataset.symbol;
                if (symbol !== selectedMarket.symbol) {
                    this.style.borderColor = '#d1d5db';
                    this.style.background = '#f9fafb';
                }
            });
            
            option.addEventListener('mouseleave', function() {
                const symbol = this.dataset.symbol;
                if (symbol !== selectedMarket.symbol) {
                    this.style.borderColor = '#e5e7eb';
                    this.style.background = 'white';
                }
            });
            
            option.addEventListener('click', function() {
                const symbol = this.dataset.symbol;
                const market = markets.find(m => m.symbol === symbol);
                
                if (market) {
                    selectedMarket = market;
                    basePrice = market.basePrice;
                    currentPrice = basePrice;
                    
                    // Update UI
                    updateMarketDisplay();
                    
                    // Reset digit statistics for new market
                    digitCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    totalTicks = 0;
                    initializeTickHistory();
                    
                    console.log(`Market changed to: ${market.name}`);
                }
                
                // Close modal
                document.body.removeChild(modal);
            });
        });
        
        // Close modal on background click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    });
}

// Update market display
function updateMarketDisplay() {
    const marketName = document.querySelector('.market-name');
    const priceValue = document.querySelector('.price-value');
    const marketIcon = document.querySelector('.market-icon svg text');
    
    if (marketName) {
        marketName.textContent = selectedMarket.name;
    }
    
    if (priceValue) {
        priceValue.textContent = currentPrice.toFixed(2);
    }
    
    if (marketIcon) {
        marketIcon.textContent = selectedMarket.icon;
    }
}

// Handle trade type selector
const tradeTypeCard = document.querySelector('.trade-type-card');
if (tradeTypeCard) {
    tradeTypeCard.addEventListener('click', function() {
        console.log('Trade type selector clicked');
        
        // Create modal for trade type selection
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        let html = '<h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #1f2937;">Select Trade Type</h3>';
        
        tradeTypes.forEach(type => {
            const isSelected = type.name === tradeType;
            html += `
                <div class="trade-type-option" data-type="${type.name}" style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    border: 2px solid ${isSelected ? '#2563eb' : '#e5e7eb'};
                    border-radius: 6px;
                    margin-bottom: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: ${isSelected ? '#eff6ff' : 'white'};
                ">
                    <span style="font-size: 24px;">${type.icon}</span>
                    <span style="flex: 1; font-size: 15px; font-weight: 600; color: #1f2937;">${type.name}</span>
                    ${isSelected ? '<span style="color: #2563eb; font-size: 20px;">✓</span>' : ''}
                </div>
            `;
        });
        
        modalContent.innerHTML = html;
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Handle trade type selection
        modalContent.querySelectorAll('.trade-type-option').forEach(option => {
            option.addEventListener('mouseenter', function() {
                if (this.dataset.type !== tradeType) {
                    this.style.borderColor = '#d1d5db';
                    this.style.background = '#f9fafb';
                }
            });
            
            option.addEventListener('mouseleave', function() {
                if (this.dataset.type !== tradeType) {
                    this.style.borderColor = '#e5e7eb';
                    this.style.background = 'white';
                }
            });
            
            option.addEventListener('click', function() {
                const selectedType = this.dataset.type;
                tradeType = selectedType;
                
                // Update UI
                const tradeTypeName = document.querySelector('.trade-type-name');
                if (tradeTypeName) {
                    tradeTypeName.textContent = selectedType;
                }
                
                // Update trade buttons based on type
                updateTradeButtons();
                
                // Close modal
                document.body.removeChild(modal);
                
                console.log(`Trade type changed to: ${selectedType}`);
            });
        });
        
        // Close modal on background click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    });
}

// Update trade buttons based on selected trade type
function updateTradeButtons() {
    const overBtn = document.querySelector('.trade-btn.over .btn-label');
    const underBtn = document.querySelector('.trade-btn.under .btn-label');
    
    if (tradeType === 'Over/Under') {
        if (overBtn) overBtn.textContent = 'Over';
        if (underBtn) underBtn.textContent = 'Under';
    } else if (tradeType === 'Even/Odd') {
        if (overBtn) overBtn.textContent = 'Even';
        if (underBtn) underBtn.textContent = 'Odd';
    } else if (tradeType === 'Matches/Differs') {
        if (overBtn) overBtn.textContent = 'Matches';
        if (underBtn) underBtn.textContent = 'Differs';
    } else if (tradeType === 'Rise/Fall') {
        if (overBtn) overBtn.textContent = 'Rise';
        if (underBtn) underBtn.textContent = 'Fall';
    }
}

// Handle risk disclaimer button
const riskDisclaimer = document.querySelector('.risk-disclaimer');
if (riskDisclaimer) {
    riskDisclaimer.addEventListener('click', function() {
        console.log('Risk disclaimer clicked');
        alert('Risk Disclaimer\n\nTrading derivatives carries a high level of risk to your capital and you should only trade with money you can afford to lose. Trading derivatives may not be suitable for all investors, so please ensure that you fully understand the risks involved and seek independent advice if necessary.\n\nA Deriv account will not protect you from losses.');
    });
}

// Initialize with some historical data
function initializeTickHistory() {
    console.log('📊 Initializing tick history...');
    // Generate realistic initial percentages
    for (let i = 0; i < 100; i++) {
        const price = generateTick();
        const lastDigit = getLastDigit(price);
        digitCounts[lastDigit]++;
        totalTicks++;
    }
    updateDigitStatistics();
}

// Start the application
console.log('🚀 Starting DTrader...');
initializeTickHistory();

// Generate new tick every 1 second
setInterval(generateNewTick, 1000);

// Initialize payouts
updatePayouts();

console.log('✅ DTrader initialized successfully');
console.log('📈 Real-time ticks streaming...');
