/**
 * Secret Access System
 * Provides hidden access to fake real mode via keyboard shortcuts and touch gestures
 * 
 * Desktop: Press keys in order: b-o-n-n-i-e-1-2-3-4, then press Enter twice within 2 seconds
 * Mobile: Tap logo 5 times, then swipe right across the screen 3 times within 3 seconds
 */

class SecretAccessSystem {
    private static instance: SecretAccessSystem;
    private sequence: string[] = [];
    private readonly secretCode = ['b', 'o', 'n', 'n', 'i', 'e', '1', '2', '3', '4'];
    private readonly timeout = 3000; // 3 seconds to complete sequence
    private timer: NodeJS.Timeout | null = null;
    private enterPressCount = 0;
    private enterPressTimer: NodeJS.Timeout | null = null;
    private isSequenceComplete = false;

    // Mobile touch gesture properties
    private logoTapCount = 0;
    private logoTapTimer: NodeJS.Timeout | null = null;
    private isMobileModeActive = false;
    private swipeCount = 0;
    private swipeTimer: NodeJS.Timeout | null = null;
    private touchStartX = 0;
    private touchStartY = 0;

    private constructor() {
        this.initializeListeners();
        this.initializeMobileListeners();
    }

    public static getInstance(): SecretAccessSystem {
        if (!SecretAccessSystem.instance) {
            SecretAccessSystem.instance = new SecretAccessSystem();
        }
        return SecretAccessSystem.instance;
    }

    private initializeListeners(): void {
        // Listen for keyboard sequence
        document.addEventListener('keydown', (e) => {
            // Ignore if user is typing in an input field
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const key = e.key.toLowerCase();
            
            // If sequence is complete, check for Enter key presses
            if (this.isSequenceComplete && key === 'enter') {
                this.handleEnterPress();
                return;
            }

            // Reset timer on each keypress
            if (this.timer) {
                clearTimeout(this.timer);
            }

            // Add key to sequence
            this.sequence.push(key);

            // Keep only the last 10 keys (length of secret code)
            if (this.sequence.length > this.secretCode.length) {
                this.sequence.shift();
            }

            // Check if sequence matches
            if (this.checkSequence()) {
                this.isSequenceComplete = true;
                this.sequence = [];
                
                // Show subtle visual feedback (very brief flash)
                document.body.style.transition = 'opacity 0.1s';
                document.body.style.opacity = '0.95';
                setTimeout(() => {
                    document.body.style.opacity = '1';
                }, 100);

                // Reset sequence complete after 5 seconds
                setTimeout(() => {
                    this.isSequenceComplete = false;
                    this.enterPressCount = 0;
                }, 5000);
            }

            // Set timeout to reset sequence
            this.timer = setTimeout(() => {
                this.sequence = [];
            }, this.timeout);
        });
    }

    private initializeMobileListeners(): void {
        // Listen for swipe gestures on the entire document
        document.addEventListener('touchstart', (e) => {
            if (!this.isMobileModeActive) return;
            
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!this.isMobileModeActive) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;

            // Check if it's a right swipe (horizontal movement > 100px, vertical < 50px)
            if (deltaX > 100 && Math.abs(deltaY) < 50) {
                this.handleSwipe();
            }
        }, { passive: true });
    }

    private checkSequence(): boolean {
        if (this.sequence.length !== this.secretCode.length) {
            return false;
        }

        return this.sequence.every((key, index) => key === this.secretCode[index]);
    }

    private handleEnterPress(): void {
        if (!this.isSequenceComplete) {
            return;
        }

        this.enterPressCount++;

        // Clear previous timer
        if (this.enterPressTimer) {
            clearTimeout(this.enterPressTimer);
        }

        // Check if 2 Enter presses within 2 seconds
        if (this.enterPressCount >= 2) {
            this.toggleFakeRealMode();
            this.enterPressCount = 0;
            this.isSequenceComplete = false;
        } else {
            // Reset Enter press count after 2 seconds
            this.enterPressTimer = setTimeout(() => {
                this.enterPressCount = 0;
            }, 2000);
        }
    }

    public handleLogoClick(): void {
        // Keep this for backward compatibility but it's no longer the primary method
        return;
    }

    public handleLogoTap(): void {
        this.logoTapCount++;

        // Clear previous timer
        if (this.logoTapTimer) {
            clearTimeout(this.logoTapTimer);
        }

        // Check if 5 taps within 3 seconds
        if (this.logoTapCount >= 5) {
            this.isMobileModeActive = true;
            this.logoTapCount = 0;
            
            // Show subtle vibration if available
            if (navigator.vibrate) {
                navigator.vibrate([50, 100, 50]);
            }

            // Show very subtle visual feedback
            document.body.style.transition = 'opacity 0.15s';
            document.body.style.opacity = '0.92';
            setTimeout(() => {
                document.body.style.opacity = '1';
            }, 150);

            // Reset mobile mode after 5 seconds
            setTimeout(() => {
                this.isMobileModeActive = false;
                this.swipeCount = 0;
            }, 5000);
        } else {
            // Reset tap count after 3 seconds
            this.logoTapTimer = setTimeout(() => {
                this.logoTapCount = 0;
            }, 3000);
        }
    }

    private handleSwipe(): void {
        if (!this.isMobileModeActive) return;

        this.swipeCount++;

        // Vibrate on each swipe
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }

        // Clear previous timer
        if (this.swipeTimer) {
            clearTimeout(this.swipeTimer);
        }

        // Check if 3 swipes completed
        if (this.swipeCount >= 3) {
            this.toggleFakeRealMode();
            this.swipeCount = 0;
            this.isMobileModeActive = false;
        } else {
            // Reset swipe count after 3 seconds
            this.swipeTimer = setTimeout(() => {
                this.swipeCount = 0;
                this.isMobileModeActive = false;
            }, 3000);
        }
    }

    private toggleFakeRealMode(): void {
        const isActive = localStorage.getItem('demo_icon_us_flag') === 'true';

        if (isActive) {
            localStorage.removeItem('demo_icon_us_flag');
        } else {
            localStorage.setItem('demo_icon_us_flag', 'true');
        }

        // Reload page immediately
        window.location.reload();
    }

    private showNotification(message: string, color: string): void {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease;
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remove after 2 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 300);
        }, 2000);
    }

    /**
     * Check if fake real mode is currently active
     */
    public isFakeRealModeActive(): boolean {
        return localStorage.getItem('demo_icon_us_flag') === 'true';
    }
}

// Export singleton instance
export const secretAccessSystem = SecretAccessSystem.getInstance();
