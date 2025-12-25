window.DailyWins = window.DailyWins || {};

window.DailyWins.Modal = {
    previousFocusElement: null,
    focusTrapHandlers: new WeakMap(),

    open(modalId, onOpen = null) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        this.previousFocusElement = document.activeElement;
        modal.classList.add('active');

        setTimeout(() => {
            this.trapFocus(modal);
            if (onOpen) onOpen(modal);
        }, 100);
    },

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('active');
        this.removeFocusTrap(modal);

        if (this.previousFocusElement) {
            this.previousFocusElement.focus();
            this.previousFocusElement = null;
        }
    },

    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeydown = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        element.addEventListener('keydown', handleKeydown);
        this.focusTrapHandlers.set(element, handleKeydown);
    },

    removeFocusTrap(element) {
        const handler = this.focusTrapHandlers.get(element);
        if (handler) {
            element.removeEventListener('keydown', handler);
            this.focusTrapHandlers.delete(element);
        }
    },

    setupPinInputs(container, onComplete) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) {
            console.error('setupPinInputs: Container not found', container);
            return;
        }

        const inputs = el.querySelectorAll('.pin-input');
        if (inputs.length === 0) {
            console.error('setupPinInputs: No .pin-input found in container', el);
            return;
        }

        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;

                if (!/^\d$/.test(value)) {
                    e.target.value = '';
                    return;
                }

                if (value && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }

                if (index === inputs.length - 1 && value) {
                    const pin = Array.from(inputs).map(i => i.value).join('');
                    if (pin.length === inputs.length && onComplete) {
                        onComplete(pin);
                    }
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });
    },

    getPinFromContainer(container) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) return '';
        const inputs = el.querySelectorAll('.pin-input');
        return Array.from(inputs).map(i => i.value).join('');
    },

    clearPinInputs(container) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) return;
        const inputs = el.querySelectorAll('.pin-input');
        inputs.forEach(input => input.value = '');
        if (inputs[0]) inputs[0].focus();
    },

    shakeElement(element) {
        element.classList.add('shake');
        setTimeout(() => element.classList.remove('shake'), 500);
    },

    showLockScreen() {
        const lockScreen = document.getElementById('lockScreen');
        if (!lockScreen) return;

        lockScreen.classList.add('active');

        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

        const recentEntries = document.getElementById('recentEntries');
        const entriesContainer = document.getElementById('entriesContainer');
        if (recentEntries) recentEntries.innerHTML = '';
        if (entriesContainer) entriesContainer.innerHTML = '';

        const pinContainer = lockScreen.querySelector('.pin-inputs');
        if (pinContainer) {
            this.clearPinInputs(pinContainer);
        }
    },

    hideLockScreen() {
        const lockScreen = document.getElementById('lockScreen');
        if (lockScreen) {
            lockScreen.classList.remove('active');
        }
    }
};
