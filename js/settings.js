window.DailyWins = window.DailyWins || {};

window.DailyWins.Settings = {
    app: null,

    init(appInstance) {
        this.app = appInstance;
    },

    applyTheme(theme) {
        this.app.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        document.body.dataset.theme = theme;
        this.app.saveData();

        document.querySelectorAll('.theme-swatch').forEach(swatch => {
            swatch.classList.toggle('active', swatch.dataset.theme === theme);
        });

        if (this.app.prettyMode) {
            this.app.Effects.initParticles(true);
        }
    },

    togglePrettyMode(enabled) {
        this.app.prettyMode = enabled;
        this.app.saveData();
        this.app.Effects.initParticles(enabled);
    },

    toggleCelebrationMode(enabled) {
        this.app.celebrationMode = enabled;
        this.app.saveData();
    },

    toggleExportReadable(enabled) {
        this.app.exportReadable = enabled;
        this.app.saveData();
    },

    addCustomTag() {
        const input = document.getElementById('newTagInput');
        const newTag = input?.value.trim();

        if (newTag && !this.app.tags.includes(newTag)) {
            this.app.tags.push(newTag);
            this.app.saveData();
            input.value = '';
            this.open();
            this.app.UI.showToast(`Tag "${newTag}" added! ✨`);
        } else if (this.app.tags.includes(newTag)) {
            this.app.UI.showToast('Tag already exists! 🌸');
        }
    },

    removeTag(tag) {
        this.app.tags = this.app.tags.filter(t => t !== tag);
        this.app.saveData();
        this.open();
    },

    open() {
        const callbacks = {
            onRemoveTag: (tag) => this.removeTag(tag),
            onToggleAutoLock: (enabled) => this.app.Privacy?.toggleAutoLock(enabled) || this.app.toggleAutoLock(enabled),
            onChangeCalmCode: () => this.app.openCalmCodeModal(true),
            onRemoveCalmCode: () => this.app.confirmRemoveCalmCode(),
            onSetCalmCode: () => this.app.openCalmCodeModal()
        };

        this.app.UI.renderSettings({
            prettyMode: this.app.prettyMode,
            celebrationMode: this.app.celebrationMode,
            exportReadable: this.app.exportReadable,
            currentTheme: this.app.currentTheme,
            tags: this.app.tags,
            privacy: this.app.privacy
        }, callbacks);

        document.getElementById('settings')?.classList.add('active');
    },

    close() {
        document.getElementById('settings')?.classList.remove('active');
    }
};
