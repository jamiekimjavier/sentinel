importScripts('config.js');
const NOTE_TAKING_KEYWORDS = ["docs.google.com/document", "notion.so", "evernote", "obsidian", "onenote", "notepad", "word", "docs"];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CHECK_TAB_CONTEXT") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs.length === 0) { sendResponse({ isNotes: false }); return; }
            const activeTab = tabs[0];
            const url = (activeTab.url || "").toLowerCase();
            const title = (activeTab.title || "").toLowerCase();
            let isNotes = false;
            for (const keyword of NOTE_TAKING_KEYWORDS) {
                if (url.includes(keyword) || title.includes(keyword)) { isNotes = true; break; }
            }
            sendResponse({ isNotes: isNotes });
        });
        return true; 
    }

    if (message.type === "STUDENT_SYNC") {
        const { email, state, classCode, connectedSeconds } = message.payload;
        const docId = encodeURIComponent(email.replace(".", "_")); 
        const logUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/telemetry_logs/${docId}?key=${FIREBASE_API_KEY}`;
        
        fetch(logUrl, { 
            method: "PATCH", 
            headers: {"Content-Type": "application/json"}, 
            body: JSON.stringify({ 
                fields: { 
                    email: { stringValue: email }, 
                    current_state: { stringValue: state }, 
                    class_code: { stringValue: classCode },
                    connected_seconds: { integerValue: String(connectedSeconds || 0) },
                    last_updated: { timestampValue: new Date().toISOString() } 
                } 
            }) 
        })
        .then(() => sendResponse({ status: "success" })).catch(e => sendResponse({ status: "error" }));
        
        let bText = "IDLE"; let bColor = "#dc2626";
        if (state === "Active") { bText = "ACTV"; bColor = "#16a34a"; }
        if (state === "Taking Notes") { bText = "NOTE"; bColor = "#ca8a04"; }
        if (state === "Disconnected") { bText = "OFF"; bColor = "#6b7280"; }

        // Safely update badge, catching errors if the tab is already closed
        if (sender.tab && sender.tab.id) {
            chrome.action.setBadgeText({ text: bText, tabId: sender.tab.id }).catch(()=>{});
            chrome.action.setBadgeBackgroundColor({ color: bColor, tabId: sender.tab.id }).catch(()=>{});
        }
        return true;
    }
    
    if (message.type === "POLL_VIBE") {
        fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/commands/vibe_${message.payload.classCode}?key=${FIREBASE_API_KEY}`)
            .then(res => res.json()).then(data => sendResponse({ timestamp: data.fields?.triggered_at?.timestampValue || null })).catch(() => sendResponse({ timestamp: null }));
        return true;
    }
});