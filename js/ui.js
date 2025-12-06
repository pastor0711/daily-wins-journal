window.DailyWins = window.DailyWins || {};

window.DailyWins.UI = {
    showView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const view = document.getElementById(viewId);
        if (view) view.classList.add('active');
    },

    renderDashboard(entries) {
        const recentEntries = document.getElementById('recentEntries');
        const emptyState = document.getElementById('emptyState');
        const viewAllBtn = document.getElementById('viewAllBtn');

        if (!recentEntries || !emptyState || !viewAllBtn) return;

        if (entries.length === 0) {
            recentEntries.innerHTML = '';
            emptyState.style.display = 'block';
            viewAllBtn.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            viewAllBtn.style.display = 'inline-flex';

            const recent = entries.slice(0, 4);
            recentEntries.innerHTML = recent.map((entry, index) =>
                this.createEntryCard(entry, index * 0.1, false, index)
            ).join('');
        }
    },

    renderTimeline(entries, tags, filter = '', search = '') {
        const container = document.getElementById('entriesContainer');
        const emptyState = document.getElementById('timelineEmpty');
        const dropdown = document.getElementById('filterTagSelect');

        if (!container || !emptyState) return;

        if (dropdown) {
            const trigger = dropdown.querySelector('.select-trigger');
            const triggerText = dropdown.querySelector('.trigger-text');
            const optionsContainer = dropdown.querySelector('.select-options');

            let optionsHtml = `<div class="select-option ${filter === '' ? 'selected' : ''}" data-value="">All Tags</div>`;
            optionsHtml += tags.map(tag =>
                `<div class="select-option ${filter === tag ? 'selected' : ''}" data-value="${tag}">${tag}</div>`
            ).join('');

            optionsContainer.innerHTML = optionsHtml;

            triggerText.textContent = filter || 'All Tags';

            if (!dropdown.hasAttribute('data-initialized')) {
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('open');
                    trigger.classList.toggle('active');
                });

                document.addEventListener('click', () => {
                    dropdown.classList.remove('open');
                    trigger.classList.remove('active');
                });

                dropdown.setAttribute('data-initialized', 'true');
            }

            optionsContainer.onclick = (e) => {
                const option = e.target.closest('.select-option');
                if (option) {
                    const value = option.dataset.value;
                    const text = option.textContent;

                    triggerText.textContent = text;
                    dropdown.classList.remove('open');
                    trigger.classList.remove('active');

                    dropdown.querySelectorAll('.select-option').forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');

                    const event = new CustomEvent('change', { detail: { value } });
                    dropdown.dispatchEvent(event);
                }
            };
        }

        let filtered = entries;

        if (filter) {
            filtered = filtered.filter(e => e.tag === filter);
        }

        if (search) {
            const query = search.toLowerCase();
            filtered = filtered.filter(e =>
                e.text.toLowerCase().includes(query) ||
                (e.note && e.note.toLowerCase().includes(query))
            );
        }

        if (filtered.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            container.innerHTML = filtered.map((entry, index) =>
                this.createEntryCard(entry, index * 0.05, true, index)
            ).join('');
        }
    },

    createEntryCard(entry, delay = 0, showFull = false, index = 0) {
        const { Utils } = window.DailyWins;
        const dateStr = Utils.formatDateShort(entry.date);
        const timeStr = Utils.formatTime ? Utils.formatTime(entry.date) : '';
        const maxLength = showFull ? 300 : 120;
        const displayText = Utils.truncate(entry.text, maxLength);
        const staggerClass = index < 8 ? `stagger-${index + 1}` : '';
        const isFavorite = entry.favorite || false;

        return `
            <div class="entry-card ${staggerClass}" data-entry-id="${entry.id}" style="animation: staggerFadeIn 0.4s ease both; animation-delay: ${delay}s" title="Click to edit">
                <div class="entry-date">
                    ${dateStr}
                    ${timeStr ? `<span class="entry-time">${timeStr}</span>` : ''}
                </div>
                <div class="entry-text">${Utils.escapeHtml(displayText)}</div>
                <div class="entry-meta">
                    ${entry.tag ? `<span class="entry-tag">${entry.tag}</span>` : ''}
                    ${entry.emoji ? `<span class="entry-emoji">${entry.emoji}</span>` : ''}
                </div>
                ${entry.note && showFull ? `<div class="entry-note">${Utils.escapeHtml(entry.note)}</div>` : ''}
                ${showFull ? `
                    <div class="entry-actions">
                        <div class="entry-quick-actions">
                            <button class="quick-action-btn favorite-btn ${isFavorite ? 'active' : ''}" 
                                    data-favorite-id="${entry.id}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                                <svg viewBox="0 0 24 24" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                            </button>
                            <button class="quick-action-btn" data-copy-id="${entry.id}" title="Copy entry">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                            <button class="quick-action-btn" data-share-id="${entry.id}" title="Share entry">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="18" cy="5" r="3"></circle>
                                    <circle cx="6" cy="12" r="3"></circle>
                                    <circle cx="18" cy="19" r="3"></circle>
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                </svg>
                            </button>
                        </div>
                        <button class="entry-delete-btn" data-delete-id="${entry.id}" title="Delete entry">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderTagBubbles(container, tags, selectedTag, onSelect) {
        if (!container) return;

        container.innerHTML = tags.map(tag => `
            <button class="tag-bubble ${selectedTag === tag ? 'selected' : ''}" 
                    data-tag="${tag}">
                ${tag}
            </button>
        `).join('');

        container.querySelectorAll('.tag-bubble').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tag = e.target.dataset.tag;
                onSelect(tag);
            });
        });
    },

    renderEmojiGrid(container, emojis, selectedEmoji, onSelect) {
        if (!container) return;

        container.innerHTML = emojis.map(emoji => `
            <button class="emoji-btn ${selectedEmoji === emoji ? 'selected' : ''}" 
                    data-emoji="${emoji}">
                ${emoji}
            </button>
        `).join('');

        container.querySelectorAll('.emoji-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emoji = e.target.dataset.emoji;
                onSelect(emoji);
            });
        });
    },

    renderSettings(state, callbacks) {
        const { prettyMode, celebrationMode, exportReadable, currentTheme, tags, privacy } = state;

        const prettyModeToggle = document.getElementById('prettyMode');
        const celebrationToggle = document.getElementById('celebrationMode');
        const exportReadableToggle = document.getElementById('exportReadableMode');

        if (prettyModeToggle) prettyModeToggle.checked = prettyMode;
        if (celebrationToggle) celebrationToggle.checked = celebrationMode;
        if (exportReadableToggle) exportReadableToggle.checked = exportReadable;

        document.querySelectorAll('.theme-swatch').forEach(swatch => {
            swatch.classList.toggle('active', swatch.dataset.theme === currentTheme);
        });

        const tagsContainer = document.getElementById('customTags');
        if (tagsContainer) {
            tagsContainer.innerHTML = tags.map(tag => `
                <div class="custom-tag-item">
                    <span>${tag}</span>
                    <button class="remove-tag-btn" data-tag="${tag}">×</button>
                </div>
            `).join('');

            tagsContainer.querySelectorAll('.remove-tag-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    if (callbacks.onRemoveTag) {
                        callbacks.onRemoveTag(e.target.dataset.tag);
                    }
                });
            });
        }

        this.renderPrivacySettings(privacy, callbacks);
    },

    renderPrivacySettings(privacy, callbacks) {
        const statusContainer = document.getElementById('privacyStatus');
        const actionsContainer = document.getElementById('privacyActions');

        if (!statusContainer || !actionsContainer) return;

        if (privacy.isLocked) {
            statusContainer.innerHTML = `
                <div class="privacy-status">
                    <div class="privacy-status-icon">🔒</div>
                    <div class="privacy-status-text">Your journal is protected</div>
                </div>
            `;

            actionsContainer.innerHTML = `
                <label class="toggle-option">
                    <input type="checkbox" id="autoLockToggle" ${privacy.autoLockEnabled ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">Auto-lock after ${privacy.autoLockMinutes} minutes</span>
                </label>
                <button class="privacy-btn" id="changeCalmCodeBtn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Change Calm Code
                </button>
                <button class="privacy-btn privacy-btn-danger" id="removeCalmCodeBtn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Remove Protection
                </button>
            `;

            const autoLockToggle = document.getElementById('autoLockToggle');
            if (autoLockToggle && callbacks.onToggleAutoLock) {
                autoLockToggle.addEventListener('change', (e) => callbacks.onToggleAutoLock(e.target.checked));
            }

            const changeCalmCodeBtn = document.getElementById('changeCalmCodeBtn');
            if (changeCalmCodeBtn && callbacks.onChangeCalmCode) {
                changeCalmCodeBtn.addEventListener('click', callbacks.onChangeCalmCode);
            }

            const removeCalmCodeBtn = document.getElementById('removeCalmCodeBtn');
            if (removeCalmCodeBtn && callbacks.onRemoveCalmCode) {
                removeCalmCodeBtn.addEventListener('click', callbacks.onRemoveCalmCode);
            }
        } else {
            statusContainer.innerHTML = `
                <div class="privacy-status">
                    <div class="privacy-status-icon">🔓</div>
                    <div class="privacy-status-text">Your journal is not protected</div>
                </div>
            `;

            actionsContainer.innerHTML = `
                <button class="privacy-btn" id="setCalmCodeBtn2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Set Your Calm Code
                </button>
            `;

            const setCalmCodeBtn2 = document.getElementById('setCalmCodeBtn2');
            if (setCalmCodeBtn2 && callbacks.onSetCalmCode) {
                setCalmCodeBtn2.addEventListener('click', callbacks.onSetCalmCode);
            }
        }
    },

    showToast(message, duration = 3000, undoCallback = null) {
        const toast = document.getElementById('toast');
        if (!toast) return;

        if (this._toastTimeout) {
            clearTimeout(this._toastTimeout);
        }

        if (undoCallback) {
            toast.innerHTML = `
                <span>${message}</span>
                <button class="toast-undo-btn" id="toastUndoBtn">Undo</button>
            `;

            const undoBtn = document.getElementById('toastUndoBtn');
            if (undoBtn) {
                undoBtn.onclick = () => {
                    undoCallback();
                    toast.classList.remove('show');
                };
            }
        } else {
            toast.innerHTML = `<span>${message}</span>`;
        }

        toast.classList.add('show');

        this._toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    },

    setModalDate(isEditing = false, date = new Date()) {
        const dateEl = document.getElementById('entryDate');
        if (!dateEl) return;

        const { Utils } = window.DailyWins;
        const dateStr = Utils.formatDate(date);
        dateEl.textContent = isEditing ? dateStr + ' (Editing)' : dateStr;
    }
};
