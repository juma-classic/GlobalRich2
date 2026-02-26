/**
 * Admin Panel Secret Access
 * Provides hidden access to admin panel via keyboard shortcut
 * 
 * Type: A-D-M-I-N, then press Enter twice within 2 seconds
 */

class AdminPanelAccess {
    private static instance: AdminPanelAccess;
    private sequence: string[] = [];
    private readonly secretCode = ['a', 'd', 'm', 'i', 'n'];
    private readonly timeout = 3000; // 3 seconds to complete sequence
    private timer: NodeJS.Timeout | null = null;
    private enterPressCount = 0;
    private enterPressTimer: NodeJS.Timeout | null = null;
    private isSequenceComplete = false;
    private onAccessGranted: (() => void) | null = null;

    private constructor() {
        this.initializeListeners();
    }

    public static getInstance(): AdminPanelAccess {
        if (!AdminPanelAccess.instance) {
            AdminPanelAccess.instance = new AdminPanelAccess();
        }
        return AdminPanelAccess.instance;
    }

    public setAccessCallback(callback: () => void): void {
        this.onAccessGranted = callback;
    }

    private initializeListeners(): void {
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

            // Keep only the last 5 keys (length of secret code)
            if (this.sequence.length > this.secretCode.length) {
                this.sequence.shift();
            }

            // Check if sequence matches
            if (this.checkSequence()) {
                this.isSequenceComplete = true;
                this.sequence = [];
                
                // Show subtle visual feedback
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
            this.openAdminPanel();
            this.enterPressCount = 0;
            this.isSequenceComplete = false;
        } else {
            // Reset Enter press count after 2 seconds
            this.enterPressTimer = setTimeout(() => {
                this.enterPressCount = 0;
            }, 2000);
        }
    }

    private openAdminPanel(): void {
        if (this.onAccessGranted) {
            this.onAccessGranted();
        }
    }
}

// Export singleton instance
export const adminPanelAccess = AdminPanelAccess.getInstance();
