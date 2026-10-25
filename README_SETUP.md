# PUP Sentinel Extension - v2 (Compat Fix)

### WHY IT WAS CRASHING (Status Code 15):
The modern modular Firebase scripts (`firebase-firestore.js`) try to import other internal files from the internet automatically. Chrome Service Workers block this, causing the worker to crash entirely.

### THE FIX:
We must use the Firebase "Compat" versions. These are single-file bundles that have **zero** external dependencies, perfect for extensions without a bundler.

### NEW SETUP STEPS:
1. Delete your old `firebase` folder and create a new empty one here.
2. Download these **COMPAT** versions into your `firebase` folder:
   - `https://www.gstatic.com/firebasejs/10.4.0/firebase-app-compat.js`
   - `https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore-compat.js`
   - `https://www.gstatic.com/firebasejs/10.4.0/firebase-auth-compat.js`
3. Paste your Firebase Keys in `background.js` and `admin.js`.
4. Keep the `tailwind.min.css` from earlier.
5. Reload in `chrome://extensions/`.
