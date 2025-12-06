window.DailyWins = window.DailyWins || {};

window.DailyWins.Storage = {
    STORAGE_KEY: 'dailyWinsData',

    getDefaults() {
        return {
            entries: [],
            theme: 'dawn',
            tags: ['Habit', 'Reflection', 'Achievement', 'Gratitude', 'Growth', 'Connection', 'Health', 'Creativity'],
            prettyMode: true,
            celebrationMode: true,
            exportReadable: true,
            privacy: {
                isLocked: false,
                pinHash: null,
                autoLockEnabled: false,
                autoLockMinutes: 5
            }
        };
    },

    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                return { ...this.getDefaults(), ...data };
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        return this.getDefaults();
    },

    save(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    },

    clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    },

    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
};
