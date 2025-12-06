window.DailyWins = window.DailyWins || {};

window.DailyWins.Crypto = {
    SALT: 'dailywins-journal-salt',

    async hashPin(pin) {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async deriveKey(pin) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(pin),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        const salt = encoder.encode(this.SALT);

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    },

    async encryptText(text, key) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );

        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.length);

        return btoa(String.fromCharCode(...combined));
    },

    async decryptText(encryptedBase64, key) {
        try {
            const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encrypted
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    },

    async encryptEntry(entry, key) {
        if (entry.encrypted) return entry;

        const encrypted = { ...entry };

        if (entry.text) {
            encrypted.text = await this.encryptText(entry.text, key);
        }
        if (entry.note) {
            encrypted.note = await this.encryptText(entry.note, key);
        }
        encrypted.encrypted = true;

        return encrypted;
    },

    async decryptEntry(entry, key) {
        if (!entry.encrypted) return entry;

        const decrypted = { ...entry };

        if (entry.text) {
            const text = await this.decryptText(entry.text, key);
            if (text) decrypted.text = text;
        }
        if (entry.note) {
            const note = await this.decryptText(entry.note, key);
            if (note) decrypted.note = note;
        }
        decrypted.encrypted = false;

        return decrypted;
    },

    async encryptAllEntries(entries, key) {
        return Promise.all(entries.map(entry => this.encryptEntry(entry, key)));
    },

    async decryptAllEntries(entries, key) {
        return Promise.all(entries.map(entry => this.decryptEntry(entry, key)));
    }
};
