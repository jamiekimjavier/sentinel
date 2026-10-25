document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    
    chrome.storage.local.get(['userEmail', 'userRole', 'classCode'], (data) => {
        if (data.userEmail && data.classCode) showDashboard(data.userEmail, data.userRole, data.classCode);
    });

    document.getElementById('login-student').addEventListener('click', () => login('student'));
    document.getElementById('login-teacher').addEventListener('click', () => login('teacher'));
    document.getElementById('logout').addEventListener('click', () => chrome.storage.local.clear(() => location.reload()));
    document.getElementById('open-admin').addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL("admin-portal.html") }));

    function login(role) {
        const email = document.getElementById('email-input').value.trim();
        const code = document.getElementById('code-input').value.trim().toUpperCase();
        if (!email || !code) return alert("Required!");
        
        const storageData = { userEmail: email, userRole: role, classCode: code };
        
        // If teacher, set the class start time to NOW for attendance percentage calculation
        if (role === 'teacher') storageData.classStartTime = Date.now();
        // If student, reset their connected seconds for the new session
        if (role === 'student') storageData.connectedSeconds = 0;

        chrome.storage.local.set(storageData, () => showDashboard(email, role, code));
    }

    function showDashboard(email, role, code) {
        loginView.classList.add('hidden'); dashboardView.classList.remove('hidden');
        document.getElementById('user-display').innerHTML = `<strong>Email:</strong> ${email}<br><strong>Role:</strong> ${role.toUpperCase()}<br><strong>Class:</strong> ${code}`;
        if (role === 'teacher') document.getElementById('open-admin').classList.remove('hidden');
    }
});