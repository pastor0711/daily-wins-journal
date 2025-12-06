window.DailyWins = window.DailyWins || {};

window.DailyWins.Entries = {
    app: null,

    init(appInstance) {
        this.app = appInstance;
    },

    delete(id) {
        const entryToDelete = this.app.entries.find(e => e.id === id);
        if (!entryToDelete) return;

        this.app.lastDeletedEntry = { ...entryToDelete };
        this.app.entries = this.app.entries.filter(e => e.id !== id);
        this.app.saveData();
        this.app.showTimeline();

        this.app.UI.showToast('Removed gracefully. 🍃', 5000, () => this.undoDelete());
    },

    undoDelete() {
        if (!this.app.lastDeletedEntry) return;

        this.app.entries.push(this.app.lastDeletedEntry);
        this.app.entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.app.saveData();
        this.app.showTimeline();
        this.app.UI.showToast('Restored! ✨');
        this.app.lastDeletedEntry = null;
    },

    toggleFavorite(id) {
        const entry = this.app.entries.find(e => e.id === id);
        if (!entry) return;

        entry.favorite = !entry.favorite;
        this.app.saveData();

        const isTimeline = document.getElementById('timeline')?.classList.contains('active');
        if (isTimeline) {
            this.app.showTimeline();
        } else {
            this.app.showDashboard();
        }

        this.app.UI.showToast(entry.favorite ? 'Added to favorites! ⭐' : 'Removed from favorites');
    },

    copy(id) {
        const entry = this.app.entries.find(e => e.id === id);
        if (!entry) return;

        const { Utils } = window.DailyWins;
        const dateStr = Utils.formatDateShort(entry.date);
        let text = `${dateStr}\n\n${entry.text}`;
        if (entry.tag) text += `\n\nTag: ${entry.tag}`;
        if (entry.emoji) text += `  ${entry.emoji}`;
        if (entry.note) text += `\n\nNote: ${entry.note}`;

        navigator.clipboard.writeText(text).then(() => {
            this.app.UI.showToast('Copied to clipboard! 📋');
        }).catch(() => {
            this.app.UI.showToast('Could not copy 😔');
        });
    },

    share(id) {
        const entry = this.app.entries.find(e => e.id === id);
        if (!entry) return;

        const { Utils } = window.DailyWins;
        const dateStr = Utils.formatDateShort(entry.date);
        let text = `${entry.text}`;
        if (entry.emoji) text += ` ${entry.emoji}`;

        if (navigator.share) {
            navigator.share({
                title: `Daily Win - ${dateStr}`,
                text: text
            }).catch(() => {
            });
        } else {
            this.copy(id);
        }
    },

    showRandom() {
        if (this.app.entries.length === 0) {
            this.app.UI.showToast('No entries yet! Add your first win. 🌸');
            return;
        }

        const { Utils } = window.DailyWins;
        const randomEntry = Utils.randomFrom(this.app.entries);
        this.app.openAddModal(randomEntry.id);
        this.app.UI.showToast('A random moment from your journey! 🎲');
    },

    filterByTag(tag) {
        const search = document.getElementById('searchInput')?.value || '';
        this.app.UI.renderTimeline(this.app.entries, this.app.tags, tag, search);
        this.app.attachEntryCardListeners('entriesContainer');
    },

    search(query) {
        const filter = document.getElementById('filterTag')?.value || '';
        this.app.UI.renderTimeline(this.app.entries, this.app.tags, filter, query);
        this.app.attachEntryCardListeners('entriesContainer');
    }
};
