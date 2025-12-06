window.DailyWins = window.DailyWins || {};

window.DailyWins.Prompts = {
    list: [
        "What felt good today?",
        "What made you smile?",
        "What's one small win you're proud of?",
        "What moment brought you peace?",
        "What are you grateful for right now?",
        "What progress did you make today?",
        "What kindness did you give or receive?",
        "What did you learn today?",
        "What beauty did you notice?",
        "What strength did you show?"
    ],

    getRandom() {
        const { Utils } = window.DailyWins;
        return Utils.randomFrom(this.list);
    },

    showRandom() {
        const promptEl = document.getElementById('dailyPrompt');
        if (promptEl && this.list.length > 0) {
            promptEl.textContent = this.getRandom();
        }
    },

    add(prompt) {
        if (prompt && !this.list.includes(prompt)) {
            this.list.push(prompt);
        }
    }
};
