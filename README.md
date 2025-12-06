# Daily Wins – Your Journal ✨

A serene, visually captivating digital journal for capturing daily wins and moments that matter. Beautiful, local, and completely pressure-free.

## Features

### 🎨 **5 Beautiful Themes**
- **Dawn** - Warm pastels for energizing mornings
- **Dusk** - Cool purples and blues for calm evenings
- **Minimal** - Clean monochrome elegance
- **Nature** - Earthy greens and golds
- **Cosmic** - Starry night sky aesthetics

### ✨ **Core Functionality**
- **Optional Daily Logging** - Write when inspired, skip when not
- **Rich Entries** - Text, tags, emojis, and optional notes
- **Beautiful Timeline** - Scrollable gallery of all your moments
- **Smart Search & Filter** - Find entries by keyword or tag
- **Custom Tags** - Create your own categories
- **Export Data** - Download as JSON (backup) and TXT (readable)
- **Import Data** - Restore from JSON backup files
- **Easy Delete** - Remove entries with visible delete buttons

### 🌸 **Gentle Experience**
- **No Pressure** - No streaks, quotas, or "missed day" guilt
- **Floating Particles** - Optional ambient animations
- **Save Celebrations** - Gentle confetti effect on save
- **Whisper Messages** - Soft affirmations when you save
- **Glassmorphism Design** - Modern, elegant UI
- **Smooth Animations** - Respects reduced-motion preferences

### 🔐 **Privacy First**
- **100% Local Storage** - All data stays in your browser
- **No Backend** - Works completely offline
- **No Tracking** - Your thoughts are private
- **No Account Needed** - Open and start using immediately
- **Optional Calm Code** - Protect your journal with a 4-digit PIN
- **AES-GCM Encryption** - Military-grade encryption for locked journals
- **Auto-Lock Timer** - Automatically locks after inactivity
- **Encrypted Backups** - Export/import with full encryption support

## How to Use

### Getting Started
1. Open `index.html` in your web browser (works directly from file://)
2. Click "Add a Win" to create your first entry
3. Write freely - everything is optional
4. Save when ready or dismiss for later

### Creating & Editing Entries
- **Create New** - Click "Add a Win" on dashboard
- **Edit Existing** - Click any entry card to open and edit
- **Text** - Your main win or reflection
- **Tag** (optional) - Categorize your entry
- **Emoji** (optional) - Add mood or feeling
- **Note** (optional) - Extra thoughts or context

### Keyboard Shortcuts
- **Enter** in text area - Save entry
- **Esc** - Close modal/panel
- **Tab** - Navigate forward through interactive elements

### Customization
1. Click the settings icon (top right)
2. Choose your theme from 5 palettes
3. Toggle pretty mode (floating particles)
4. Toggle celebration mode (save effects)
5. Add custom tags for your needs

### Privacy & Security

**Set Your Calm Code (Optional):**
1. Open Settings → Privacy section
2. Click "Set Your Calm Code"
3. Enter a 4-digit code twice to confirm
4. Your entries are now encrypted and protected

**Forgot Your Code?**
- Click "Forgot your code?" on the lock screen
- Downloads encrypted backup of all entries
- Resets journal to start fresh
- Later, import the backup with your original code to restore

## Technical Details

### Built With
- Vanilla HTML5, CSS3, JavaScript (ES6+)
- No frameworks or dependencies
- LocalStorage API for data persistence
- Canvas API for celebration effects
- Web Crypto API for encryption (SHA-256, PBKDF2, AES-GCM)

### Browser Compatibility
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers supported

### Project Structure
```
daily-wins-journal/
├── index.html              # Main HTML structure
├── styles.css              # CSS module imports
├── app.js                  # Original (backup)
├── README.md               # Documentation
│
├── js/                     # JavaScript modules
│   ├── utils.js            # DOM helpers, formatting, debounce
│   ├── storage.js          # localStorage persistence
│   ├── crypto.js           # AES encryption, PIN hashing
│   ├── effects.js          # Particles, celebrations
│   ├── modal.js            # Focus traps, PIN inputs
│   ├── ui.js               # View rendering
│   └── app.js              # Main DailyWinsApp class
│
└── css/                    # CSS modules
    ├── variables.css       # Themes, custom properties
    ├── base.css            # Reset, typography
    ├── animations.css      # Keyframes, effects
    ├── components.css      # Buttons, cards, inputs
    ├── layout.css          # Views, grids, header
    ├── modals.css          # Modal styles
    └── responsive.css      # Mobile breakpoints
```

### Module Overview

| JS Module | Purpose |
|-----------|---------|
| `utils.js` | `escapeHtml()`, `formatDate()`, `debounce()` |
| `storage.js` | `load()`, `save()`, `clear()` for localStorage |
| `crypto.js` | SHA-256 hashing, AES-GCM encryption/decryption |
| `effects.js` | Floating particles, confetti celebrations |
| `modal.js` | Focus trapping, PIN input auto-advance |
| `ui.js` | Dashboard, timeline, settings rendering |
| `app.js` | Main class orchestrating all modules |

### Data Storage
All data is stored in browser localStorage under `dailyWinsData`:
```json
{
  "entries": [...],
  "theme": "dawn",
  "tags": [...],
  "prettyMode": true,
  "celebrationMode": true,
  "privacy": {
    "isLocked": false,
    "pinHash": null,
    "autoLockEnabled": false
  }
}
```

## For Developers

### Adding a Theme
Edit `css/variables.css`:
```css
[data-theme="your-theme"] {
    --bg-primary: linear-gradient(...);
    --accent-primary: #yourcolor;
    /* ... */
}
```

### Customizing Messages
Edit `js/app.js`:
```javascript
const whispers = [
    'Gently noted. 🌸',
    'Your custom message! ✨',
];
```

### Changing Default Tags
Edit `js/storage.js`:
```javascript
tags: ['Habit', 'Reflection', 'YourTag'],
```

## Troubleshooting

### Lost Data?
Data is stored locally. Clearing browser data removes entries. Export regularly!

### Forgot Your Calm Code?
Use "Forgot your code?" → downloads encrypted backup → resets journal.

### Particles Not Showing?
Check Pretty Mode in Settings, or "Reduce Motion" in OS settings.

## License
Free to use for personal journaling. Made with care. ✨

---

**Remember:** This app exists to support you, not to judge you. Write when inspired, rest when needed. 🌸
