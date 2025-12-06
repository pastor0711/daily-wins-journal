window.DailyWins = window.DailyWins || {};

window.DailyWins.Privacy = {
    app: null,

    init(appInstance) {
        this.app = appInstance;
    },

    showLockScreen() {
        this.app.Modal.showLockScreen();
        this.setupLockScreenPinInputs();
    },

    setupLockScreenPinInputs() {
        this.app.Modal.setupPinInputs('lockScreen', (pin) => this.checkPin(pin));
    },

    setupCalmCodeModalInputs() {
        const step1Container = document.getElementById('calmCodeStep1');
        const step2Container = document.getElementById('calmCodeStep2');

        this.app.Modal.setupPinInputs('calmCodeStep1', (pin) => {
            if (pin.length === 4) {
                if (step1Container) step1Container.style.display = 'none';
                if (step2Container) step2Container.style.display = 'block';
                document.getElementById('confirmPin1')?.focus();
            }
        });

        this.app.Modal.setupPinInputs('calmCodeStep2', (pin) => {
        });
    },

    async checkPin(pin) {
        if (pin.length !== 4) return;

        const hash = await this.app.Crypto.hashPin(pin);

        if (hash === this.app.privacy.pinHash) {
            this.app.unlockKey = await this.app.Crypto.deriveKey(pin);
            await this.unlockApp();
        } else {
            const container = document.querySelector('#lockScreen .pin-inputs');
            if (container) {
                this.app.Modal.shakeElement(container);
                this.app.Modal.clearPinInputs(container);
            }

            const lockMessage = document.querySelector('.lock-message');
            if (lockMessage) {
                const originalText = lockMessage.textContent;
                lockMessage.textContent = 'Try again...';
                lockMessage.style.color = 'var(--text-accent)';
                setTimeout(() => {
                    lockMessage.textContent = originalText;
                    lockMessage.style.color = '';
                }, 2000);
            }
        }
    },

    async unlockApp() {
        this.app.Modal.hideLockScreen();
        this.app.isUnlocked = true;

        if (this.app.unlockKey) {
            await this.decryptAllEntries();
        }

        this.app.showDashboard();
        this.startAutoLockTimer();
        this.app.UI.showToast('Welcome back. 🌸');
    },

    async lockApp() {
        if (this.app.unlockKey && this.app.privacy.isLocked) {
            await this.encryptAllEntries();
        }

        this.app.isUnlocked = false;
        this.app.unlockKey = null;
        this.clearAutoLockTimer();
        this.showLockScreen();
    },

    openCalmCodeModal(isChange = false) {
        this.app.Settings?.close() || this.app.closeSettings?.();

        const step1 = document.getElementById('calmCodeStep1');
        const step2 = document.getElementById('calmCodeStep2');

        if (step1) step1.style.display = 'block';
        if (step2) step2.style.display = 'none';

        ['setPin', 'confirmPin'].forEach(prefix => {
            for (let i = 1; i <= 4; i++) {
                const input = document.getElementById(`${prefix}${i}`);
                if (input) input.value = '';
            }
        });

        const errorEl = document.getElementById('calmCodeError');
        if (errorEl) errorEl.textContent = '';

        this.app.Modal.open('setCalmCodeModal', (modal) => {
            document.getElementById('setPin1')?.focus();
        });
    },

    closeCalmCodeModal() {
        this.app.Modal.close('setCalmCodeModal');
    },

    async processCalmCodeSetup() {
        const setPin = Array.from({ length: 4 }, (_, i) =>
            document.getElementById(`setPin${i + 1}`)?.value || ''
        ).join('');

        const confirmPin = Array.from({ length: 4 }, (_, i) =>
            document.getElementById(`confirmPin${i + 1}`)?.value || ''
        ).join('');

        const errorEl = document.getElementById('calmCodeError');

        if (setPin.length !== 4) {
            if (errorEl) errorEl.textContent = 'Please enter a 4-digit code';
            return;
        }

        if (confirmPin.length !== 4) {
            if (errorEl) errorEl.textContent = 'Please confirm your code';
            return;
        }

        if (setPin !== confirmPin) {
            if (errorEl) errorEl.textContent = 'Codes do not match. Please try again.';
            for (let i = 1; i <= 4; i++) {
                const input = document.getElementById(`confirmPin${i}`);
                if (input) input.value = '';
            }
            document.getElementById('confirmPin1')?.focus();
            return;
        }

        await this.setCalmCode(setPin);
        this.closeCalmCodeModal();
    },

    async setCalmCode(pin) {
        const hash = await this.app.Crypto.hashPin(pin);
        this.app.privacy.isLocked = true;
        this.app.privacy.pinHash = hash;
        this.app.unlockKey = await this.app.Crypto.deriveKey(pin);

        await this.encryptAllEntries();

        this.app.saveData();
        this.app.isUnlocked = true;
        this.startAutoLockTimer();
        this.app.UI.showToast('Your journal is now protected. ✨');
    },

    confirmRemoveCalmCode() {
        if (confirm('Remove protection from your journal?\n\nYour entries will be decrypted and the Calm Code will be removed.')) {
            this.removeCalmCode();
            this.app.Settings?.open() || this.app.openSettings?.();
        }
    },

    async removeCalmCode() {
        if (this.app.unlockKey) {
            await this.decryptAllEntries();
        }

        this.app.privacy.isLocked = false;
        this.app.privacy.pinHash = null;
        this.app.privacy.autoLockEnabled = false;
        this.app.unlockKey = null;
        this.app.isUnlocked = false;

        this.clearAutoLockTimer();
        this.app.saveData();
        this.app.UI.showToast('Privacy protection removed. 🍃');
    },

    async encryptAllEntries() {
        if (!this.app.unlockKey) return;

        for (let entry of this.app.entries) {
            if (entry.encrypted) continue;

            if (entry.text) {
                entry.text = await this.app.Crypto.encryptText(entry.text, this.app.unlockKey);
            }
            if (entry.note) {
                entry.note = await this.app.Crypto.encryptText(entry.note, this.app.unlockKey);
            }
            entry.encrypted = true;
        }

        this.app.saveData();
    },

    async decryptAllEntries() {
        if (!this.app.unlockKey) return;

        for (let entry of this.app.entries) {
            if (!entry.encrypted) continue;

            if (entry.text) {
                const decrypted = await this.app.Crypto.decryptText(entry.text, this.app.unlockKey);
                if (decrypted) entry.text = decrypted;
            }
            if (entry.note) {
                const decrypted = await this.app.Crypto.decryptText(entry.note, this.app.unlockKey);
                if (decrypted) entry.note = decrypted;
            }
            entry.encrypted = false;
        }
    },

    startAutoLockTimer() {
        this.clearAutoLockTimer();

        if (this.app.privacy.autoLockEnabled && this.app.privacy.isLocked) {
            const minutes = this.app.privacy.autoLockMinutes || 5;
            this.app.autoLockTimer = setTimeout(() => this.lockApp(), minutes * 60 * 1000);
        }
    },

    clearAutoLockTimer() {
        if (this.app.autoLockTimer) {
            clearTimeout(this.app.autoLockTimer);
            this.app.autoLockTimer = null;
        }
    },

    resetAutoLockTimer() {
        if (this.app.isUnlocked && this.app.privacy.autoLockEnabled) {
            this.startAutoLockTimer();
        }
    },

    toggleAutoLock(enabled) {
        this.app.privacy.autoLockEnabled = enabled;
        this.app.saveData();

        if (enabled) {
            this.startAutoLockTimer();
        } else {
            this.clearAutoLockTimer();
        }
    },

    showForgotCodeModal() {
        this.app.Modal.open('forgotCodeModal', (modal) => {
            document.getElementById('exportAndResetBtn')?.focus();
        });
    },

    closeForgotCodeModal() {
        this.app.Modal.close('forgotCodeModal');
    },

    exportAndReset() {
        this.app.Data?.exportEncryptedBackup() || this.app.exportEncryptedBackup?.();

        setTimeout(() => {
            this.app.Storage.clear();
            this.app.UI.showToast('Backup exported. Reloading with fresh journal... 🌿');

            setTimeout(() => window.location.reload(), 1500);
        }, 500);
    }
};
