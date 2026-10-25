let myClassCode = null;
let myClassStartTime = Date.now() - (60 * 60 * 1000); 
let currentStudentList = [];
let globalAvgEngagement = 0;

const dummyRoster = [
    { email: "j.delacruz@sentinel.edu", name: "Juan Dela Cruz", classCode: "BSIT301", mockState: "Active", mockConn: 3500 },
    { email: "m.santos@sentinel.edu", name: "Maria Santos", classCode: "BSIT301", mockState: "Taking Notes", mockConn: 3200 },
    { email: "c.reyes@sentinel.edu", name: "Christian Reyes", classCode: "BSIT301", mockState: "Idle", mockConn: 3000 },
    { email: "a.bautista@sentinel.edu", name: "Angela Bautista", classCode: "BSIT301", mockState: "Disconnected", mockConn: 2000 },
    { email: "p.mendoza@sentinel.edu", name: "Paulo Mendoza", classCode: "BSIT301", mockState: "Offline", mockConn: 0 },
    { email: "l.garcia@sentinel.edu", name: "Lian Garcia", classCode: "BSIT301", mockState: "Active", mockConn: 3450 },
    { email: "k.villanueva@sentinel.edu", name: "Kevin Villanueva", classCode: "BSIT301", mockState: "Taking Notes", mockConn: 3400 },
    { email: "r.aquino@sentinel.edu", name: "Rafael Aquino", classCode: "BSIT301", mockState: "Idle", mockConn: 3100 },
    { email: "m.ramos@sentinel.edu", name: "Mikaela Ramos", classCode: "BSIT301", mockState: "Disconnected", mockConn: 900 },
    { email: "t.cruz@sentinel.edu", name: "Tomas Cruz", classCode: "BSIT301", mockState: "Offline", mockConn: 0 },
    
    { email: "d.cruz@sentinel.edu", name: "Daniel Cruz", classCode: "CS401", mockState: "Active", mockConn: 3550 },
    { email: "p.ramos@sentinel.edu", name: "Paolo Ramos", classCode: "CS401", mockState: "Taking Notes", mockConn: 3300 },
    { email: "n.fernandez@sentinel.edu", name: "Nicole Fernandez", classCode: "CS401", mockState: "Hidden", mockConn: 1500 },
    { email: "a.villanueva@sentinel.edu", name: "Adrian Villanueva", classCode: "CS401", mockState: "Disconnected", mockConn: 2400 },
    { email: "b.alonzo@sentinel.edu", name: "Bea Alonzo", classCode: "CS401", mockState: "Offline", mockConn: 0 }
];

function getPastAttendance(email, dayIndex) {
    const seed = email.charCodeAt(0) + email.charCodeAt(1) + dayIndex;
    if (seed % 7 === 0) return "Absent";
    if (seed % 11 === 0) return "Partial";
    return "Present";
}

document.querySelectorAll('.nav-item').forEach(nav => {
    nav.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        nav.classList.add('active');
        document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
        
        const targetView = document.getElementById(nav.dataset.target);
        if (targetView) targetView.classList.remove('hidden');
    });
});

const closeBtn = document.getElementById('close-modal');
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        document.getElementById('student-modal').classList.add('hidden');
    });
}

chrome.storage.local.get(['userEmail', 'classCode', 'classStartTime'], (data) => {
    if (data.userEmail) {
        const emailEl = document.getElementById('header-user-email');
        const avatarEl = document.getElementById('header-user-avatar');
        if (emailEl) emailEl.textContent = data.userEmail;
        if (avatarEl) avatarEl.textContent = data.userEmail.charAt(0).toUpperCase();
    }
    if (data.classStartTime) {
        myClassStartTime = data.classStartTime;
    }
    
    const selectEl = document.getElementById('global-class-select');
    if (selectEl) {
        const knownClasses = ["BSIT301", "CS401"];
        if (data.classCode && !knownClasses.includes(data.classCode)) knownClasses.push(data.classCode);
        
        selectEl.innerHTML = "";
        knownClasses.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c; opt.text = "Class: " + c;
            if (c === data.classCode) opt.selected = true;
            selectEl.appendChild(opt);
        });

        selectEl.addEventListener('change', (e) => {
            myClassCode = e.target.value;
            chrome.storage.local.set({ classCode: myClassCode });
            updateGlobalContext();
        });
    }

    if (data.classCode) {
        myClassCode = data.classCode;
        updateGlobalContext();
        setInterval(loadTable, 4000); 
    }
});

function updateGlobalContext() {
    const dispClass = document.getElementById('disp-class-code');
    if (dispClass) dispClass.textContent = myClassCode;
    loadTable(); 
}

function openStudentModal(email) {
    const student = currentStudentList.find(s => s.email === email);
    if (!student) return;
    
    const nameEl = document.getElementById('modal-name');
    const emailEl = document.getElementById('modal-email');
    const statusEl = document.getElementById('modal-status');
    const scoreEl = document.getElementById('modal-score');
    
    if (nameEl) nameEl.textContent = student.name;
    if (emailEl) emailEl.textContent = student.email;
    if (statusEl) statusEl.innerHTML = `<span class="status-pill ${student.cssClass}">${student.state}</span>`;
    if (scoreEl) scoreEl.textContent = student.durationPct + "%";
    
    const tContainer = document.getElementById('modal-timeline');
    if (tContainer) {
        let h = "";
        if (student.durationPct >= 80) h = `<div class="seg-active" style="width:${student.durationPct}%"></div><div class="seg-idle" style="width:${100-student.durationPct}%"></div>`;
        else if (student.durationPct >= 50) h = `<div class="seg-active" style="width:${student.durationPct}%"></div><div class="seg-idle" style="width:${100-student.durationPct}%"></div>`;
        else if (student.durationPct > 0) h = `<div class="seg-active" style="width:${student.durationPct}%"></div><div class="seg-idle" style="width:${100-student.durationPct}%"></div>`;
        else h = `<div style="background:#9ca3af; width:100%;"></div>`;
        
        tContainer.innerHTML = h;
    }
    
    const modal = document.getElementById('student-modal');
    if (modal) modal.classList.remove('hidden');
}

function loadTable() {
    if (!myClassCode) return;
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/telemetry_logs?key=${FIREBASE_API_KEY}`;
    
    let elapsedClassSeconds = Math.max(1, (Date.now() - myClassStartTime) / 1000);
    if (elapsedClassSeconds < 100) elapsedClassSeconds = 3600; 

    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error("Network or permission error");
            return res.json();
        })
        .then(data => {
            renderTableData(data.documents || [], elapsedClassSeconds);
        })
        .catch(err => {
            console.warn("Firebase fetch failed, falling back to local roster mapping.", err);
            renderTableData([], elapsedClassSeconds);
        });
}

function renderTableData(liveDocuments, elapsedClassSeconds) {
    const tableBody = document.getElementById("table-body");
    const attendanceBody = document.getElementById("attendance-body");
    
    if (tableBody) tableBody.innerHTML = ""; 
    if (attendanceBody) attendanceBody.innerHTML = "";
    currentStudentList = [];

    const combinedStudents = new Map();
    
    // Seed roster
    dummyRoster.forEach(student => {
        if (student.classCode === myClassCode) {
            combinedStudents.set(student.email, {
                email: student.email, name: student.name,
                state: student.mockState, connectedSeconds: student.mockConn, last_updated: null
            });
        }
    });

    // Merge Live
    liveDocuments.forEach((doc) => {
        const fields = doc.fields || {};
        if ((fields.class_code ? fields.class_code.stringValue : "") === myClassCode) {
            const email = fields.email ? fields.email.stringValue : "Unknown";
            const state = fields.current_state ? fields.current_state.stringValue : "Unknown";
            const connectedSeconds = fields.connected_seconds ? parseInt(fields.connected_seconds.integerValue) : 0;
            
            let last_updated = null;
            if (fields.last_updated && fields.last_updated.timestampValue) {
                last_updated = new Date(fields.last_updated.timestampValue);
            }
            
            let name = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (combinedStudents.has(email)) name = combinedStudents.get(email).name;
            combinedStudents.set(email, { email, name, state, connectedSeconds, last_updated });
        }
    });

    let studentsFound = 0, activeCount = 0, flaggedCount = 0, sumDurations = 0;

    if (combinedStudents.size === 0) {
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px; color:#6b7280;">No students in class <b>${myClassCode}</b>.</td></tr>`;
        if (attendanceBody) attendanceBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px; color:#6b7280;">No students in class <b>${myClassCode}</b>.</td></tr>`;
        return;
    }

    combinedStudents.forEach((student) => {
        studentsFound++;
        const { email, name, state, connectedSeconds, last_updated } = student;
        
        let lastUpdatedStr = "Live";
        if (last_updated) lastUpdatedStr = last_updated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        
        if (state === "Active" || state.includes("Taking")) activeCount++;
        if (state === "Idle" || state === "Disconnected" || state === "Offline" || state === "Hidden") flaggedCount++;

        let cssClass = "status-Idle"; 
        if (state === "Active") cssClass = "status-Active";
        else if (state.includes("Taking")) cssClass = "status-Taking";
        else if (state === "Disconnected") cssClass = "status-Disconnected";
        else if (state === "Offline") cssClass = "status-Offline";
        else if (state === "Hidden") cssClass = "status-Hidden";
        else if (state === "Idle") cssClass = "status-Idle";

        // EXACT DURATION CALCULATION
        let durationPct = Math.min(100, Math.round((connectedSeconds / elapsedClassSeconds) * 100));
        if (isNaN(durationPct)) durationPct = 0;
        
        sumDurations += durationPct;

        let engageColor = "#dc2626"; // Red (< 50)
        if (durationPct >= 80) engageColor = "#16a34a"; // Green
        else if (durationPct >= 50) engageColor = "#f59e0b"; // Yellow

        const mins = Math.floor(connectedSeconds / 60);
        const secs = connectedSeconds % 60;
        const timeString = `${mins}m ${secs}s`;

        currentStudentList.push({ email, name, state, durationPct, cssClass });

        // 1. LIVE DASHBOARD ROW
        if (tableBody) {
            const tr = document.createElement('tr');
            tr.className = "clickable-row";
            tr.innerHTML = `
                <td>
                    <div class="student-info">
                        <div class="student-initials">${email.substring(0,2).toUpperCase()}</div>
                        <div><div class="student-name">${name}</div><div class="student-email">${email}</div></div>
                    </div>
                </td>
                <td><span class="status-pill ${cssClass}">${state}</span></td>
                <td style="color:#4b5563; font-weight:500;">${timeString}</td>
                <td>
                    <div class="engagement-wrapper">
                        <div class="engagement-score" style="color: ${engageColor}">${durationPct}%</div>
                        <div class="engagement-track"><div class="engagement-fill" style="width: ${durationPct}%; background: ${engageColor};"></div></div>
                    </div>
                </td>
            `;
            tr.addEventListener('click', () => openStudentModal(email));
            tableBody.appendChild(tr);
        }

        // 2. ATTENDANCE CALENDAR ROW
        if (attendanceBody) {
            let pastColsHTML = "";
            for(let i=0; i<4; i++) {
                let s = getPastAttendance(email, i);
                if(s === "Present") pastColsHTML += `<td class="cell-present">✓</td>`;
                else if(s === "Partial") pastColsHTML += `<td style="color:#d97706; text-align:center; font-weight:bold;">P</td>`;
                else pastColsHTML += `<td class="cell-absent">✗</td>`;
            }
            
            let todayHTML = "";
            if (durationPct >= 80) {
                todayHTML = `<td class="cell-present" style="background:#dcfce7;">Present</td>`;
            } else if (durationPct >= 50) {
                todayHTML = `<td style="color:#d97706; font-weight:bold; text-align:center; background:#fef08a;">Partial/Late</td>`;
            } else {
                todayHTML = `<td class="cell-absent" style="background:#fee2e2;">Absent</td>`;
            }

            const attRow = `
                <tr>
                    <td style="font-weight:600;"><div style="font-size:14px; color:#111c2d;">${name}</div><div style="font-size:11px; color:#6b7280;">${email}</div></td>
                    ${pastColsHTML}
                    ${todayHTML}
                    <td style="text-align:center;"><span style="font-weight:bold; color:${engageColor};">${durationPct}%</span></td>
                </tr>
            `;
            attendanceBody.insertAdjacentHTML('beforeend', attRow);
        }
    });

    globalAvgEngagement = studentsFound > 0 ? Math.round(sumDurations / studentsFound) : 0;
    
    // SAFE UI UPDATES
    const dispAvg = document.getElementById('disp-class-avg');
    const dispAct = document.getElementById('disp-active-count');
    const dispFlag = document.getElementById('disp-flagged-count');
    const pCode = document.getElementById('print-class-code');
    const pDate = document.getElementById('print-date');
    const pHealth = document.getElementById('print-health');
    
    if (dispAvg) dispAvg.textContent = globalAvgEngagement + "%";
    if (dispAct) dispAct.textContent = `${activeCount} / ${studentsFound}`;
    if (dispFlag) dispFlag.textContent = flaggedCount;
    if (pCode) pCode.textContent = myClassCode;
    if (pDate) pDate.textContent = new Date().toLocaleString();
    if (pHealth) pHealth.textContent = globalAvgEngagement + "%";
}

const vibeBtn = document.getElementById('vibe-check-btn');
if (vibeBtn) {
    vibeBtn.addEventListener('click', (e) => {
        if (!myClassCode) return;
        const btn = e.target;
        btn.innerHTML = "Broadcasting...";
        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/commands/vibe_${myClassCode}?key=${FIREBASE_API_KEY}`;
        fetch(url, { method: "PATCH", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ fields: { triggered_at: { timestampValue: new Date().toISOString() } } }) })
        .then(() => setTimeout(() => { btn.innerHTML = "⚡ Send Vibe Check"; }, 2000));
    });
}

document.querySelectorAll('.export-csv-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if(currentStudentList.length === 0) return alert("No data to export!");
        let csvContent = "data:text/csv;charset=utf-8,Name,Email,Current_Status,Time_Percentage\n";
        currentStudentList.forEach(row => {
            csvContent += `"${row.name}","${row.email}","${row.state}","${row.durationPct}%"\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Sentinel_Telemetry_${myClassCode}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});

document.querySelectorAll('.export-pdf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const viewAtt = document.querySelector('[data-target="view-attendance"]');
        if(viewAtt) viewAtt.click();
        setTimeout(() => window.print(), 300);
    });
});

const addClassBtn = document.getElementById('add-class-btn');
if (addClassBtn) {
    addClassBtn.addEventListener('click', () => {
        alert('Feature coming in next update. Currently tracking active login class.');
    });
}
