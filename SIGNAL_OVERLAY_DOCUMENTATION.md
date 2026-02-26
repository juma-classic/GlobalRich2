# Signal Overlay Tool Documentation

## Overview
A production-ready floating signal overlay panel for Deriv API trading that generates Over/Under signals using Novagrid 2026 bot strategy combined with distribution-based probability analysis.

## Features

### Core Specifications
- **Panel Size**: 200px × auto height (max 600px)
- **Position**: Fixed top-right corner (z-index: 999999)
- **Signal Duration**: 120 seconds per signal
- **Signal Types**: OVER and UNDER only
- **Minimum Confidence**: 65% threshold
- **Market**: Volatility 50 Index (R_50)

### Signal Generation Logic
The tool uses a hybrid approach combining:

1. **Novagrid 2026 Strategy**
   - Mean reversion analysis
   - Statistical deviation detection
   - Distribution-based probability

2. **Patel-Style Distribution Analysis**
   - Analyzes last 50 ticks
   - Counts OVER (digits 5-9) vs UNDER (digits 0-4)
   - Generates signals when bias exceeds 60%
   - Confidence score based on distribution strength

### Prediction Logic
- **Prediction 1**: Executes under normal conditions (pre-loss state)
- **Prediction 2**: Executes only after a loss is detected
- State-based switching (deterministic, no randomness)

### Risk Management
- **Take Profit**: Configurable profit target
- **Stop Loss**: Configurable loss limit
- **Validation**: All inputs must be positive numbers

## File Structure

```
src/components/signal-overlay/
├── SignalOverlay.tsx          # Main React component
├── signal-overlay-engine.ts   # Core signal generation engine
├── types.ts                   # TypeScript type definitions
├── SignalOverlay.scss         # Styling
└── index.ts                   # Export barrel
```

## Usage

### Integration
The Signal Overlay is automatically integrated into the main layout and appears on all pages.

### Configuration
1. Enter **Prediction 1** value (used in normal state)
2. Enter **Prediction 2** value (used after loss)
3. Set **Take Profit** target
4. Set **Stop Loss** limit
5. Click **Load** to initialize the engine

### Signal Display
When a signal is generated, the panel shows:
- Signal type (OVER or UNDER)
- Market (R_50)
- Confidence percentage
- Countdown timer (120 seconds)
- Active prediction value

## Technical Details

### Signal Generation Process
1. **Connection**: Subscribes to Deriv API tick stream for R_50
2. **Buffer**: Maintains last 100 ticks in memory
3. **Analysis**: Every 5 seconds, checks if conditions are met:
   - Minimum 50 ticks collected
   - No active signal exists
   - Distribution analysis performed
4. **Threshold**: Only generates signal if confidence ≥ 65%
5. **Expiry**: Signal automatically expires after 120 seconds

### Distribution Analysis Algorithm
```typescript
// Count OVER (5-9) and UNDER (0-4) digits
lastDigits.forEach(digit => {
    if (digit >= 5) overCount++;
    else underCount++;
});

// Calculate percentages
overPercentage = (overCount / total) * 100;
underPercentage = (underCount / total) * 100;

// Determine bias (mean reversion)
if (overPercentage > 60) {
    bias = 'UNDER';  // Predict reversion
    confidence = overPercentage + 5;
} else if (underPercentage > 60) {
    bias = 'OVER';   // Predict reversion
    confidence = underPercentage + 5;
}
```

### Error Handling
- **API Connection Failures**: Auto-retry after 5 seconds
- **Invalid Inputs**: Inline validation messages
- **Duplicate Signals**: Prevented by signal ID tracking
- **Memory Management**: Automatic cleanup on unmount

### Performance Optimizations
- Tick buffer limited to 100 items
- Signal check interval: 5 seconds (prevents excessive processing)
- Countdown updates: 1 second intervals
- Async operations: Non-blocking UI

## API Integration

### Deriv API Service
Uses existing `derivAPIService` from your application:
```typescript
derivAPIService.subscribeToTicks(market, callback)
```

### Data Flow
```
Deriv API → Tick Stream → Buffer → Analysis → Signal → UI Update
```

## State Management

### Engine States
- `isInitialized`: Engine ready status
- `currentSignal`: Active signal data
- `tickBuffer`: Recent tick history
- `activeSignalIds`: Duplicate prevention
- `currentOutcome`: Trade result state

### UI States
- `isLoaded`: Engine initialization status
- `activeSignal`: Current signal display
- `config`: User input values
- `validationErrors`: Input validation messages
- `tradeOutcome`: Win/loss state
- `isProcessing`: Loading state

## Validation Rules

### Input Validation
- Must be numeric
- Cannot be negative
- Cannot be empty
- Real-time validation feedback

### Signal Validation
- Minimum 50 ticks required
- Confidence must be ≥ 65%
- No duplicate signals allowed
- Automatic expiry after 120 seconds

## Styling

### Theme Support
- Light mode (default)
- Dark mode (auto-detected)
- Responsive design
- Smooth animations

### Visual Indicators
- Green pulse: Engine active
- OVER signal: Green background
- UNDER signal: Red background
- Countdown timer: Blue text

## Troubleshooting

### Signal Not Generating
1. Check if engine is loaded (green pulse indicator)
2. Verify Deriv API connection
3. Wait for minimum 50 ticks to be collected
4. Check console for confidence scores

### Validation Errors
- Ensure all fields have valid positive numbers
- Check for typos or special characters
- Clear and re-enter values if needed

### Connection Issues
- Engine auto-retries every 5 seconds
- Check browser console for error messages
- Verify Deriv API credentials

## Best Practices

### Configuration
- Start with conservative prediction values
- Set realistic take profit/stop loss limits
- Monitor signal confidence levels
- Adjust based on market conditions

### Signal Usage
- Wait for high confidence signals (>70%)
- Don't chase every signal
- Respect the 120-second validity window
- Track win/loss patterns

### Risk Management
- Never risk more than you can afford to lose
- Use stop loss consistently
- Take profits at reasonable levels
- Monitor overall performance

## Maintenance

### Cleanup
Engine automatically cleans up on component unmount:
- Unsubscribes from API
- Clears intervals
- Releases memory

### Logging
All operations are logged to console:
- Signal generation
- Confidence scores
- Distribution analysis
- State changes

## Future Enhancements

Potential improvements:
- Multiple market support
- Historical performance tracking
- Signal strength visualization
- Custom confidence thresholds
- Export signal history

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify all configuration values
3. Review this documentation
4. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-19  
**Status**: Production Ready
