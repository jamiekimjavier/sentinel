let currentState = "Active";
let lastActivityTime = Date.now();
let userRole = null; 
let userEmail = null; 
let classCode = null;
let lastVibeTimestamp = null;
let uiInjected = false;
let telemetryInterval = null;
let connectedSeconds = 0; // Tracks cumulative connection duration

const IDLE_THRESHOLD = 3 * 60 * 1000; 

const resetIdleTimer = () => {
    if (!uiInjected) return;
    lastActivityTime = Date.now();
    if (currentState === "Idle") evaluateState();
};

window.addEventListener("mousemove", resetIdleTimer);
window.addEventListener("keydown", resetIdleTimer);

document.addEventListener("visibilitychange", () => {
    if (!uiInjected) return; // Prevent null errors before UI loads
    if (document.visibilityState === "hidden") {
        try {
            chrome.runtime.sendMessage({ type: "CHECK_TAB_CONTEXT" }, (response) => {
                if (chrome.runtime.lastError) return; // Handle disconnects cleanly
                if (response && response.isNotes) currentState = "Taking Notes";
                else currentState = "Hidden";
                updateHudVisuals();
                syncData();
            });
        } catch (e) {} // Catch context invalidation errors
    } else {
        resetIdleTimer();
        currentState = "Active";
        updateHudVisuals();
        syncData();
    }
});

function evaluateState() {
    if (!uiInjected) return;
    if (document.visibilityState === "visible") {
        if (Date.now() - lastActivityTime > IDLE_THRESHOLD) currentState = "Idle";
        else currentState = "Active";
    }
    updateHudVisuals();
}

function syncData() {
    if (!uiInjected) return;
    try {
        chrome.runtime.sendMessage({ 
            type: "STUDENT_SYNC", 
            payload: { email: userEmail, state: currentState, classCode, connectedSeconds } 
        }, (res) => {
            if (chrome.runtime.lastError) return; // Ignore unhandled request errors
        });
    } catch (e) {}
}

function startTelemetryLoop() {
    chrome.storage.local.get(['connectedSeconds'], (data) => {
        if (data.connectedSeconds) connectedSeconds = data.connectedSeconds;
    });

    telemetryInterval = setInterval(() => {
        if (userRole !== "student" || !classCode || !uiInjected) return;

        const inCallIndicator = document.querySelector('[data-tooltip*="Leave"], [aria-label*="Leave call"], [data-tooltip*="microphone"]');
        if (!inCallIndicator && window.location.pathname.length < 5) {
             currentState = "Disconnected";
             syncData();
             clearInterval(telemetryInterval);
             return;
        }

        evaluateState();
        
        if (currentState !== "Disconnected" && currentState !== "Offline") {
            connectedSeconds += 5; 
            chrome.storage.local.set({ connectedSeconds }); 
        }

        syncData();

        try {
            chrome.runtime.sendMessage({ type: "POLL_VIBE", payload: { classCode } }, (res) => {
                if (chrome.runtime.lastError) return;
                if (res && res.timestamp) {
                    if (lastVibeTimestamp && res.timestamp !== lastVibeTimestamp) {
                        alert(`⚡ VIBE CHECK!\nYour Instructor for ${classCode} requested your attention.\nClick OK to confirm you are present.`);
                        resetIdleTimer();
                        currentState = "Active";
                        syncData();
                    }
                    lastVibeTimestamp = res.timestamp;
                }
            });
        } catch (e) {}
    }, 5000); 
}

window.addEventListener('beforeunload', () => {
    if (userRole === "student" && classCode && uiInjected) {
        currentState = "Disconnected";
        syncData();
    }
});

function injectUI() {
    if (uiInjected || userRole !== "student") return;
    uiInjected = true;

    const helmetSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7.58 2 4 5.58 4 10V22L8 18L12 22L16 18L20 22V10C20 5.58 16.42 2 12 2ZM12 13C10.34 13 9 11.66 9 10C9 8.34 10.34 7 12 7C13.66 7 15 8.34 15 10C15 11.66 13.66 13 12 13Z"/></svg>`;

    const hud = document.createElement('div');
    hud.id = "sentinel-hud-container";
    hud.style.cssText = `
        position: fixed; top: 20px; left: 20px; width: 280px; 
        background: #ffffff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); 
        z-index: 9999999; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        border: 2px solid #800000; overflow: hidden; user-select: none;
    `;

    hud.innerHTML = `
        <div id="sentinel-hud-header" style="background: #800000; color: #ffffff; padding: 12px; cursor: move; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-weight: bold; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                <div style="background: #FFD700; color: #800000; width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                    ${helmetSvg}
                </div>
                Sentinel Tracker
            </div>
            <div style="font-size: 11px; background: #FFD700; color: #800000; padding: 3px 8px; border-radius: 12px; font-weight: bold;">
                ${classCode}
            </div>
        </div>
        <div style="padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; background: #f3f4f6; padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                <div style="font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold;">Live Status</div>
                <div id="sentinel-status-text" style="font-size: 14px; font-weight: bold; color: #16a34a;">Active</div>
            </div>
            <div style="font-size: 10px; color: #6b7280; text-align: center;">
                Notes detection is now <b>automatic</b> via tab context.<br>No manual toggle required.
            </div>
        </div>
    `;

    document.body.appendChild(hud);

    const header = document.getElementById('sentinel-hud-header');
    
    let isDragging = false, startX, startY, initialLeft, initialTop;
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX; startY = e.clientY;
        const rect = hud.getBoundingClientRect();
        initialLeft = rect.left; initialTop = rect.top;
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        hud.style.left = `${initialLeft + (e.clientX - startX)}px`;
        hud.style.top = `${initialTop + (e.clientY - startY)}px`;
    });
    window.addEventListener('mouseup', () => { isDragging = false; });
}

function updateHudVisuals() {
    const textEl = document.getElementById('sentinel-status-text');
    if (!textEl) return;
    if (currentState === "Active") {
        textEl.textContent = "Active"; textEl.style.color = "#16a34a"; 
    } else if (currentState === "Taking Notes") {
        textEl.textContent = "Notes Open"; textEl.style.color = "#ca8a04"; 
    } else if (currentState === "Disconnected") {
        textEl.textContent = "Disconnected"; textEl.style.color = "#6b7280"; 
    } else {
        textEl.textContent = currentState; textEl.style.color = "#dc2626"; 
    }
}

setTimeout(() => {
    const inCallIndicator = document.querySelector('[data-tooltip*="Leave"], [aria-label*="Leave call"], [data-tooltip*="microphone"]');
    if (inCallIndicator || window.location.pathname.length > 5) {
        chrome.storage.local.get(['userEmail', 'userRole', 'classCode'], (data) => {
            if (data.userEmail && data.classCode) {
                userEmail = data.userEmail;
                userRole = data.userRole;
                classCode = data.classCode;
                if (userRole === "student") {
                    injectUI();
                    startTelemetryLoop();
                }
            }
        });
    }
}, 3000);
