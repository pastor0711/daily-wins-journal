window.DailyWins = window.DailyWins || {};

class DailyWinsApp {
    constructor() {
        this.Storage = window.DailyWins.Storage;
        this.Crypto = window.DailyWins.Crypto;
        this.Effects = window.DailyWins.Effects;
        this.Modal = window.DailyWins.Modal;
        this.UI = window.DailyWins.UI;
        this.Utils = window.DailyWins.Utils;

        this.Prompts = window.DailyWins.Prompts;
        this.Entries = window.DailyWins.Entries;
        this.Settings = window.DailyWins.Settings;
        this.Data = window.DailyWins.Data;
        this.Privacy = window.DailyWins.Privacy;

        this.entries = [];
        this.currentTheme = 'dawn';
        this.prettyMode = true;
        this.celebrationMode = true;
        this.exportReadable = true;
        this.tags = [];
        this.emojis = ['✨', '🌸', '🌿', '💫', '🦋', '🌈', '☀️', '🌙', '⭐', '💛', '🌺', '🍃'];

        this.currentEntry = { id: null, text: '', tag: '', emoji: '', note: '' };
        this.editingEntry = null;

        this.privacy = {
            isLocked: false,
            pinHash: null,
            autoLockEnabled: false,
            autoLockMinutes: 5
        };
        this.isUnlocked = false;
        this.unlockKey = null;
        this.autoLockTimer = null;
        this.pendingImportData = null;

        this.lastDeletedEntry = null;

        if (this.Entries) this.Entries.init(this);
        if (this.Settings) this.Settings.init(this);
        if (this.Data) this.Data.init(this);
        if (this.Privacy) this.Privacy.init(this);

        this.init();
    }

    init() {
        this.loadData();

        if (this.privacy.isLocked && !this.isUnlocked) {
            this.showLockScreen();
        } else {
            this.UI.showView('dashboard');
            this.UI.renderDashboard(this.entries);
            this.attachEntryCardListeners('recentEntries');
            this.startAutoLockTimer();
        }

        this.setupEventListeners();
        this.Effects.initParticles(this.prettyMode);
        this.applyTheme(this.currentTheme);

        if (this.Prompts) {
            this.Prompts.showRandom();
        }
    }

    loadData() {
        const data = this.Storage.load();
        this.entries = data.entries || [];
        this.currentTheme = data.theme || 'dawn';
        this.tags = data.tags || this.Storage.getDefaults().tags;
        this.prettyMode = data.prettyMode !== undefined ? data.prettyMode : true;
        this.celebrationMode = data.celebrationMode !== undefined ? data.celebrationMode : true;
        this.exportReadable = data.exportReadable !== undefined ? data.exportReadable : true;

        if (data.privacy) {
            this.privacy = { ...this.privacy, ...data.privacy };
        }
    }

    saveData() {
        this.Storage.save({
            entries: this.entries,
            theme: this.currentTheme,
            tags: this.tags,
            prettyMode: this.prettyMode,
            celebrationMode: this.celebrationMode,
            exportReadable: this.exportReadable,
            privacy: this.privacy
        });
    }

    setupEventListeners() {
        document.getElementById('addEntryBtn')?.addEventListener('click', () => this.openAddModal());
        document.getElementById('viewAllBtn')?.addEventListener('click', () => this.showTimeline());
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.openSettings());
        document.getElementById('searchBtn')?.addEventListener('click', () => this.showTimeline());

        document.getElementById('closeModal')?.addEventListener('click', () => this.closeAddModal());
        document.getElementById('laterBtn')?.addEventListener('click', () => this.closeAddModal());
        document.getElementById('saveBtn')?.addEventListener('click', () => this.saveEntry());
        document.querySelector('#addModal .modal-overlay')?.addEventListener('click', () => this.closeAddModal());

        document.getElementById('entryText')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
                e.preventDefault();
                this.saveEntry();
            }
        });

        document.getElementById('entryText')?.addEventListener('input', (e) => {
            this.updateCharCounter(e.target.value);
        });

        document.getElementById('surpriseMeBtn')?.addEventListener('click', () => this.showRandomEntry());

        document.getElementById('backToHome')?.addEventListener('click', () => this.showDashboard());

        document.getElementById('filterTagSelect')?.addEventListener('change', (e) => {
            this.showTimeline(e.detail.value, document.getElementById('searchInput').value);
        });

        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            const activeOption = document.querySelector('#filterTagSelect .select-option.selected');
            const currentFilter = activeOption ? activeOption.dataset.value : '';
            this.showTimeline(currentFilter, e.target.value);
        });

        document.getElementById('closeSettings')?.addEventListener('click', () => this.closeSettings());
        document.querySelector('.settings-overlay')?.addEventListener('click', () => this.closeSettings());
        document.getElementById('prettyMode')?.addEventListener('change', (e) => this.togglePrettyMode(e.target.checked));
        document.getElementById('celebrationMode')?.addEventListener('change', (e) => this.toggleCelebrationMode(e.target.checked));
        document.getElementById('exportReadableMode')?.addEventListener('change', (e) => this.toggleExportReadable(e.target.checked));
        document.getElementById('addTagBtn')?.addEventListener('click', () => this.addCustomTag());
        document.getElementById('newTagInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCustomTag();
        });
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportData());
        document.getElementById('importBtn')?.addEventListener('click', () => this.triggerImport());
        document.getElementById('importFile')?.addEventListener('change', (e) => this.importData(e));

        document.querySelectorAll('.theme-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => this.applyTheme(e.currentTarget.dataset.theme));
        });

        this.setupLockScreenPinInputs();

        document.getElementById('closeCalmCodeModal')?.addEventListener('click', () => this.closeCalmCodeModal());
        document.getElementById('cancelCalmCodeBtn')?.addEventListener('click', () => this.closeCalmCodeModal());
        document.getElementById('setCalmCodeBtn')?.addEventListener('click', () => this.processCalmCodeSetup());
        this.setupCalmCodeModalInputs();

        document.getElementById('closeForgotCodeModal')?.addEventListener('click', () => this.closeForgotCodeModal());
        document.getElementById('cancelForgotCodeBtn')?.addEventListener('click', () => this.closeForgotCodeModal());
        document.getElementById('exportAndResetBtn')?.addEventListener('click', () => this.exportAndReset());

        document.getElementById('closeDecryptImportModal')?.addEventListener('click', () => this.closeDecryptImportModal());
        document.getElementById('cancelDecryptBtn')?.addEventListener('click', () => this.closeDecryptImportModal());
        this.setupDecryptImportInputs();

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.getElementById('addModal')?.classList.contains('active')) {
                    this.closeAddModal();
                } else if (document.getElementById('settings')?.classList.contains('active')) {
                    this.closeSettings();
                }
            }
        });

        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => this.resetAutoLockTimer(), { passive: true });
        });
    }

    setupLockScreenPinInputs() {
        this.Privacy.setupLockScreenPinInputs();
    }

    setupCalmCodeModalInputs() {
        this.Privacy.setupCalmCodeModalInputs();
    }

    setupDecryptImportInputs() {
        this.Data.setupDecryptImportInputs();
    }

    showDashboard() {
        this.UI.showView('dashboard');
        this.UI.renderDashboard(this.entries);
        this.attachEntryCardListeners('recentEntries');
    }

    showTimeline(filter = '', search = '') {
        this.UI.showView('timeline');
        this.UI.renderTimeline(this.entries, this.tags, filter, search);
        this.attachEntryCardListeners('entriesContainer');
    }

    attachEntryCardListeners(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.querySelectorAll('.entry-card').forEach(card => {
            const entryId = parseInt(card.dataset.entryId);

            card.addEventListener('click', (e) => {
                if (!e.target.closest('.entry-delete-btn') &&
                    !e.target.closest('.quick-action-btn')) {
                    this.openAddModal(entryId);
                }
            });

            card.addEventListener('touchstart', () => card.classList.add('touched'), { passive: true });
            card.addEventListener('touchend', () => setTimeout(() => card.classList.remove('touched'), 200), { passive: true });
        });

        container.querySelectorAll('.entry-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.deleteId);
                this.deleteEntry(id);
            });
        });

        container.querySelectorAll('[data-favorite-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.favoriteId);
                this.toggleFavorite(id);
            });
        });

        container.querySelectorAll('[data-copy-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.copyId);
                this.copyEntry(id);
            });
        });

        container.querySelectorAll('[data-share-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.shareId);
                this.shareEntry(id);
            });
        });
    }

    openAddModal(entryId = null) {
        if (entryId) {
            this.editingEntry = this.entries.find(e => e.id === entryId);
            if (this.editingEntry) {
                this.UI.setModalDate(true, this.editingEntry.date);
                document.getElementById('entryText').value = this.editingEntry.text;
                document.getElementById('entryNote').value = this.editingEntry.note || '';
                this.currentEntry = {
                    id: this.editingEntry.id,
                    text: this.editingEntry.text,
                    tag: this.editingEntry.tag || '',
                    emoji: this.editingEntry.emoji || '',
                    note: this.editingEntry.note || ''
                };
            }
        } else {
            this.editingEntry = null;
            this.UI.setModalDate(false);
            document.getElementById('entryText').value = '';
            document.getElementById('entryNote').value = '';
            this.currentEntry = { id: null, text: '', tag: '', emoji: '', note: '' };
        }

        const handleTagSelect = (tag) => {
            this.currentEntry.tag = this.currentEntry.tag === tag ? '' : tag;
            this.UI.renderTagBubbles(
                document.getElementById('tagBubbles'),
                this.tags,
                this.currentEntry.tag,
                handleTagSelect
            );
        };

        const handleEmojiSelect = (emoji) => {
            this.currentEntry.emoji = this.currentEntry.emoji === emoji ? '' : emoji;
            this.UI.renderEmojiGrid(
                document.getElementById('emojiGrid'),
                this.emojis,
                this.currentEntry.emoji,
                handleEmojiSelect
            );
        };

        this.UI.renderTagBubbles(
            document.getElementById('tagBubbles'),
            this.tags,
            this.currentEntry.tag,
            handleTagSelect
        );

        this.UI.renderEmojiGrid(
            document.getElementById('emojiGrid'),
            this.emojis,
            this.currentEntry.emoji,
            handleEmojiSelect
        );

        const saveSpan = document.querySelector('#saveBtn span');
        if (saveSpan) saveSpan.textContent = this.editingEntry ? 'Update?' : 'Save if ready?';

        this.Modal.open('addModal', (modal) => {
            document.getElementById('entryText')?.focus();
        });
    }

    closeAddModal() {
        this.Modal.close('addModal');
        this.editingEntry = null;
    }

    openSettings() {
        const callbacks = {
            onRemoveTag: (tag) => this.removeTag(tag),
            onToggleAutoLock: (enabled) => this.toggleAutoLock(enabled),
            onChangeCalmCode: () => this.openCalmCodeModal(),
            onRemoveCalmCode: () => this.confirmRemoveCalmCode(),
            onSetCalmCode: () => this.openCalmCodeModal()
        };

        this.UI.renderSettings({
            prettyMode: this.prettyMode,
            celebrationMode: this.celebrationMode,
            exportReadable: this.exportReadable,
            currentTheme: this.currentTheme,
            tags: this.tags,
            privacy: this.privacy
        }, callbacks);

        this.Modal.open('settings');
    }

    closeSettings() {
        document.getElementById('settings')?.classList.remove('active');
    }

    saveEntry() {
        const text = document.getElementById('entryText')?.value.trim();

        if (!text) {
            this.UI.showToast('Write something beautiful first... 🌸');
            return;
        }

        const note = document.getElementById('entryNote')?.value.trim();

        if (this.editingEntry) {
            const index = this.entries.findIndex(e => e.id === this.editingEntry.id);
            if (index !== -1) {
                this.entries[index] = {
                    ...this.entries[index],
                    text,
                    tag: this.currentEntry.tag,
                    emoji: this.currentEntry.emoji,
                    note
                };
                this.saveData();
                this.closeAddModal();
                this.UI.showToast('Updated beautifully. ✨');
                this.showDashboard();
            }
        } else {
            const entry = {
                id: Date.now(),
                date: new Date().toISOString(),
                text,
                tag: this.currentEntry.tag,
                emoji: this.currentEntry.emoji,
                note
            };

            this.entries.unshift(entry);
            this.saveData();
            this.closeAddModal();

            if (this.celebrationMode) {
                this.Effects.celebrate();
            }

            const whispers = [
                'Gently noted. 🌸',
                'Beautifully captured. ✨',
                'A moment preserved. 💫',
                'Saved with care. 🌿',
                'Your story grows. 🦋'
            ];
            this.UI.showToast(this.Utils.randomFrom(whispers));
            this.showDashboard();
        }
    }

    deleteEntry(id) {
        this.Entries.delete(id);
    }

    undoDelete() {
        this.Entries.undoDelete();
    }

    toggleFavorite(id) {
        this.Entries.toggleFavorite(id);
    }

    copyEntry(id) {
        this.Entries.copy(id);
    }

    shareEntry(id) {
        this.Entries.share(id);
    }

    showRandomEntry() {
        this.Entries.showRandom();
    }

    updateCharCounter(text) {
        const counter = document.getElementById('charCounter');
        if (!counter) return;

        const length = text.length;
        const maxLength = 500;
        counter.textContent = `${length} / ${maxLength}`;

        if (length > maxLength * 0.9) {
            counter.classList.add('warning');
        } else {
            counter.classList.remove('warning');
        }
    }

    filterEntries(tag) {
        this.Entries.filterByTag(tag);
    }

    searchEntries(query) {
        this.Entries.search(query);
    }

    applyTheme(theme) {
        this.Settings.applyTheme(theme);
    }

    togglePrettyMode(enabled) {
        this.Settings.togglePrettyMode(enabled);
    }

    toggleCelebrationMode(enabled) {
        this.Settings.toggleCelebrationMode(enabled);
    }

    toggleExportReadable(enabled) {
        this.Settings.toggleExportReadable(enabled);
    }

    addCustomTag() {
        this.Settings.addCustomTag();
    }

    removeTag(tag) {
        this.Settings.removeTag(tag);
    }

    showLockScreen() {
        this.Privacy.showLockScreen();
    }

    async checkPin(pin) {
        await this.Privacy.checkPin(pin);
    }

    async unlockApp() {
        await this.Privacy.unlockApp();
    }

    async lockApp() {
        await this.Privacy.lockApp();
    }

    openCalmCodeModal() {
        this.Privacy.openCalmCodeModal();
    }

    closeCalmCodeModal() {
        this.Privacy.closeCalmCodeModal();
    }

    async processCalmCodeSetup() {
        await this.Privacy.processCalmCodeSetup();
    }

    async setCalmCode(pin) {
        await this.Privacy.setCalmCode(pin);
    }

    confirmRemoveCalmCode() {
        this.Privacy.confirmRemoveCalmCode();
    }

    async removeCalmCode() {
        await this.Privacy.removeCalmCode();
    }

    async encryptAllEntries() {
        await this.Privacy.encryptAllEntries();
    }

    async decryptAllEntries() {
        await this.Privacy.decryptAllEntries();
    }

    startAutoLockTimer() {
        this.Privacy.startAutoLockTimer();
    }

    clearAutoLockTimer() {
        this.Privacy.clearAutoLockTimer();
    }

    resetAutoLockTimer() {
        this.Privacy.resetAutoLockTimer();
    }

    toggleAutoLock(enabled) {
        this.Privacy.toggleAutoLock(enabled);
    }

    showForgotCodeModal() {
        this.Privacy.showForgotCodeModal();
    }

    closeForgotCodeModal() {
        this.Privacy.closeForgotCodeModal();
    }

    exportAndReset() {
        this.Privacy.exportAndReset();
    }

    exportEncryptedBackup() {
        this.Data.exportEncryptedBackup();
    }

    triggerImport() {
        this.Data.triggerImport();
    }

    async importData(event) {
        await this.Data.import(event);
    }

    async importRegularData(importedData) {
        await this.Data.importRegularData(importedData);
    }

    showDecryptImportModal(entryCount) {
        this.Data.showDecryptImportModal(entryCount);
    }

    closeDecryptImportModal() {
        this.Data.closeDecryptImportModal();
    }

    async attemptDecryptImport(pin) {
        await this.Data.attemptDecryptImport(pin);
    }

    async exportData() {
        await this.Data.export();
    }

    downloadJSON(data, filename) {
        this.Data.downloadJSON(data, filename);
    }

    downloadReadableText(entries, isEncrypted) {
        this.Data.downloadReadableText(entries, isEncrypted);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new DailyWinsApp();

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.app?.prettyMode) {
                window.app.Effects.initParticles(true);
            }
        }, 500);
    });
});

window.showForgotCodeModal = function () {
    window.app?.showForgotCodeModal();
};
