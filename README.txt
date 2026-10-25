Army v0.12.0 - War Story Laboratory / 戰場人生實驗室
====================================================

This is a standalone addition to the existing Army GitHub Pages game.
This ZIP contains NEW files only. It does not replace index.html or the camp / battle code.

INSTALLATION
1. Open the ZIP. Upload the following files to the Vmylife/Army repository,
   keeping the relative folder structure:

   war-story.html
   src/war-story/story.css
   src/war-story/story-engine.js
   src/war-story/story-ui.js

2. Deploy GitHub Pages and open:
   https://vmylife.github.io/Army/war-story.html

FEATURES
- Soldier nickname and 1-100 training score slider
- Select any combination of ten positive and ten negative traits
- Up to 36 months of generated war chronicles, including early death / repatriation
- 92 event types with branching descriptions, memories, traits and follow-ups
- War merits, rescue history, promotions, absurd moments and achievements
- Monthly autoplay / pause / speed / reveal all
- Restart with the same score and traits; copy and save story as UTF-8 TXT
- Offline, deterministic rule-based event system; does not require AI/API keys

NOTES
- This is an experiment; it does not yet import scores from camp mini-games.
- Achievements currently appear in the single-run result, not yet a persistent gallery.
- Text and events are fictional dark-humor scenarios, not accounts of real battles.
- No existing camp model, rendering, or navigation files are changed.
- For best results, test on GitHub Pages (ES modules require an HTTP(S) server).
