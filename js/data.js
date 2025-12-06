window.DailyWins = window.DailyWins || {};

window.DailyWins.Data = {
    app: null,

    init(appInstance) {
        this.app = appInstance;
    },

    triggerImport() {
        document.getElementById('importFile')?.click();
    },

    async import(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target.result;
                let importedData;

                try {
                    importedData = JSON.parse(content);
                } catch {
                    this.app.UI.showToast('Invalid file format. Please use JSON. ❌');
                    return;
                }

                if (!importedData.entries || !Array.isArray(importedData.entries)) {
                    this.app.UI.showToast('Invalid data structure. ❌');
                    return;
                }

                if (importedData.encrypted && importedData.privacy?.pinHash) {
                    this.app.pendingImportData = importedData;
                    this.showDecryptImportModal(importedData.entries.length);
                } else {
                    await this.importRegularData(importedData);
                }
            } catch (error) {
                console.error('Import error:', error);
                this.app.UI.showToast('Error importing file. ❌');
            }

            event.target.value = '';
        };

        reader.readAsText(file);
    },

    async importRegularData(importedData) {
        const count = importedData.entries.length;

        if (confirm(`Import ${count} entries?\n\nClick OK to ADD to existing entries.`)) {
            const existingIds = new Set(this.app.entries.map(e => e.id));
            const newEntries = importedData.entries.filter(e => !existingIds.has(e.id));

            this.app.entries = [...this.app.entries, ...newEntries];
            this.app.entries.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (importedData.tags) {
                importedData.tags.forEach(tag => {
                    if (!this.app.tags.includes(tag)) this.app.tags.push(tag);
                });
            }

            if (importedData.theme) {
                this.app.Settings?.applyTheme(importedData.theme) || this.app.applyTheme(importedData.theme);
            }

            this.app.saveData();
            this.app.showDashboard();
            this.app.UI.showToast(`Imported ${newEntries.length} new entries! ✨`);
        }
    },

    showDecryptImportModal(entryCount) {
        document.getElementById('decryptEntryCount').textContent = entryCount;

        const container = document.getElementById('decryptPinInputs');
        if (container) this.app.Modal.clearPinInputs(container);

        document.getElementById('decryptError').textContent = '';

        this.app.Modal.open('decryptImportModal', (modal) => {
            document.getElementById('decryptPin1')?.focus();
        });

        this.app.UI.showToast('Encrypted backup detected. 🔐');
    },

    closeDecryptImportModal() {
        this.app.Modal.close('decryptImportModal');
        this.app.pendingImportData = null;
        this.app.UI.showToast('Import cancelled. 🌸');
    },

    setupDecryptImportInputs() {
        this.app.Modal.setupPinInputs('decryptPinInputs', (pin) => this.attemptDecryptImport(pin));
    },

    async attemptDecryptImport(pin) {
        if (!this.app.pendingImportData || pin.length !== 4) return;

        const errorEl = document.getElementById('decryptError');
        const importedData = this.app.pendingImportData;

        try {
            const pinHash = await this.app.Crypto.hashPin(pin);

            if (pinHash !== importedData.privacy.pinHash) {
                if (errorEl) errorEl.textContent = 'Incorrect code. Try again...';
                const container = document.getElementById('decryptPinInputs');
                if (container) {
                    this.app.Modal.shakeElement(container);
                    this.app.Modal.clearPinInputs(container);
                }
                return;
            }

            if (errorEl) errorEl.textContent = '';
            this.app.UI.showToast('Decrypting entries... 🔓');

            const decryptKey = await this.app.Crypto.deriveKey(pin);

            const decryptedEntries = [];
            for (let entry of importedData.entries) {
                if (entry.encrypted) {
                    const decryptedEntry = { ...entry };

                    if (entry.text) {
                        const text = await this.app.Crypto.decryptText(entry.text, decryptKey);
                        if (text) decryptedEntry.text = text;
                        else throw new Error('Failed to decrypt entry text');
                    }

                    if (entry.note) {
                        const note = await this.app.Crypto.decryptText(entry.note, decryptKey);
                        if (note) decryptedEntry.note = note;
                    }

                    decryptedEntry.encrypted = false;
                    decryptedEntries.push(decryptedEntry);
                } else {
                    decryptedEntries.push(entry);
                }
            }

            this.app.Modal.close('decryptImportModal');

            const existingIds = new Set(this.app.entries.map(e => e.id));
            const newEntries = decryptedEntries.filter(e => !existingIds.has(e.id));

            this.app.entries = [...this.app.entries, ...newEntries];
            this.app.entries.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (importedData.tags) {
                importedData.tags.forEach(tag => {
                    if (!this.app.tags.includes(tag)) this.app.tags.push(tag);
                });
            }

            if (this.app.privacy.isLocked && this.app.unlockKey) {
                await this.app.Privacy?.encryptAllEntries() || await this.app.encryptAllEntries();
                await this.app.Privacy?.decryptAllEntries() || await this.app.decryptAllEntries();
            }

            this.app.saveData();
            this.app.showDashboard();
            this.app.UI.showToast(`Imported and decrypted ${newEntries.length} entries! ✨🔓`);

            this.app.pendingImportData = null;

        } catch (error) {
            console.error('Decryption error:', error);
            if (errorEl) errorEl.textContent = 'Failed to decrypt. Check your code.';
            const container = document.getElementById('decryptPinInputs');
            if (container) {
                this.app.Modal.shakeElement(container);
                this.app.Modal.clearPinInputs(container);
            }
        }
    },

    async export() {
        if (this.app.entries.length === 0) {
            this.app.UI.showToast('No entries to export yet. 🌸');
            return;
        }

        const isEncrypted = this.app.privacy.isLocked && this.app.entries.some(e => e.encrypted);

        let readableEntries = this.app.entries;
        if (this.app.exportReadable && isEncrypted && this.app.unlockKey) {
            readableEntries = [];
            for (let entry of this.app.entries) {
                const tempEntry = { ...entry };
                if (entry.encrypted) {
                    if (entry.text) {
                        const decrypted = await this.app.Crypto.decryptText(entry.text, this.app.unlockKey);
                        if (decrypted) tempEntry.text = decrypted;
                    }
                    if (entry.note) {
                        const decrypted = await this.app.Crypto.decryptText(entry.note, this.app.unlockKey);
                        if (decrypted) tempEntry.note = decrypted;
                    }
                }
                readableEntries.push(tempEntry);
            }
        }

        const data = {
            entries: this.app.entries,
            theme: this.app.currentTheme,
            tags: this.app.tags,
            prettyMode: this.app.prettyMode,
            celebrationMode: this.app.celebrationMode,
            exportReadable: this.app.exportReadable,
            privacy: this.app.privacy,
            exportedAt: new Date().toISOString()
        };

        const jsonFilename = isEncrypted
            ? `daily-wins-encrypted-backup-${Date.now()}.json`
            : `daily-wins-backup-${Date.now()}.json`;

        this.downloadJSON(data, jsonFilename);

        if (this.app.exportReadable) {
            this.downloadReadableText(readableEntries, isEncrypted);
            const encryptedLabel = isEncrypted ? ' (encrypted)' : '';
            this.app.UI.showToast(`Exported: JSON${encryptedLabel} + readable TXT! 📖`);
        } else {
            const encryptedLabel = isEncrypted ? ' (encrypted)' : '';
            this.app.UI.showToast(`Exported: JSON${encryptedLabel} backup! 📦`);
        }
    },

    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    downloadReadableText(entries, isEncrypted) {
        const { Utils } = window.DailyWins;

        let content = '====================================\n';
        content += '       DAILY WINS LOG EXPORT\n';
        content += '====================================\n\n';
        content += `Exported on: ${Utils.formatDate(new Date())}\n`;
        content += `Total Entries: ${entries.length}\n`;
        if (isEncrypted && this.app.unlockKey) {
            content += `Status: Decrypted for reading\n`;
        }
        content += '\n====================================\n\n';

        const sorted = [...entries].reverse();

        sorted.forEach((entry, index) => {
            const dateStr = Utils.formatDate(entry.date);
            content += `Entry #${index + 1}\n`;
            content += `Date: ${dateStr}\n`;
            if (entry.tag) content += `Tag: ${entry.tag}\n`;
            if (entry.emoji) content += `Mood: ${entry.emoji}\n`;
            content += `\n${entry.text}\n`;
            if (entry.note) content += `\nNote: ${entry.note}\n`;
            content += '\n------------------------------------\n\n';
        });

        content += '====================================\n';
        content += '   Thank you for using Daily Wins! ✨\n';
        content += '====================================\n';

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `daily-wins-readable-${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    exportEncryptedBackup() {
        if (this.app.entries.length === 0) {
            this.app.UI.showToast('No entries to backup. 🌸');
            return;
        }

        const data = {
            entries: this.app.entries,
            theme: this.app.currentTheme,
            tags: this.app.tags,
            prettyMode: this.app.prettyMode,
            celebrationMode: this.app.celebrationMode,
            privacy: this.app.privacy,
            exportedAt: new Date().toISOString(),
            encrypted: true,
            note: 'This backup contains encrypted entries. You will need your original Calm Code to decrypt them.'
        };

        this.downloadJSON(data, `daily-wins-encrypted-backup-${Date.now()}.json`);
        this.app.UI.showToast('Encrypted backup downloaded! 📦');
    }
};
