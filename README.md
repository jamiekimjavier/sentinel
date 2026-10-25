# **Sentinel - A Privacy-First Academic Telemetry and Engagement Tracker 🚀**

Sentinel is a class-code synchronized Chrome Extension designed for Google Meet that measures student engagement without resorting to invasive proctoring methodologies. It bridges the critical gap between academic compliance tracking and digital privacy rights.

The rapid transition to virtual learning environments has created a need for effective academic telemetry. However, prevailing solutions frequently employ invasive methods like deep system keylogging and unauthorized screen capture, infringing upon student privacy. This platform addresses the critical gaps in **virtual classroom monitoring**, ensuring that **student privacy is strictly protected under the Data Privacy Act (RA 10173)**. This initiative directly contributes to **student trust** by utilizing zero-payload tracking and **institutional oversight** by providing instructors with real-time, actionable analytics and automated attendance matrices.

## **Features 🌟**

### **Features Overview**

Sentinel offers a comprehensive suite of tools designed to provide empirical engagement metrics while maintaining strict data privacy:

- **Zero-Payload Tracking:** 🤖 Calculates engagement via browser states (active window focus, Picture-in-Picture, and contextual note-taking behaviors) rather than invasive screen capturing or keylogging. Only localized state enums (e.g., 'Active', 'Idle') are transmitted.
- **Dual-Role Interfaces (HUD & Portal):** 👨‍🏫 Features a synchronized mutual class code system. Students get a transparent, draggable Heads-Up Display (HUD) for real-time status feedback, while instructors access a multi-tab Admin Portal with live dashboards and cohort statistics.
- **Automated Attendance & Compliance Export:** 📊 Generates a chronological calendar matrix processing duration algorithms to assign official attendance states. Automatically exports compliance-ready CSV and PDF ledgers.
- **Vibe Check Polling:** 🔔 A broadcast mechanism for instructors to force a localized alert on student screens, verifying active presence and resetting idle trackers upon confirmation.

### **Screenshots**

*(Add screenshots of the Student HUD, Instructor Analytics Portal, and Attendance Calendar Matrix here)*

## **Getting Started 🏁**

This project was built as a Manifest V3 Chrome Extension interfacing with a Firebase Cloud Database. 

### **Prerequisites**

- Node.js (v14.x or higher)  
- npm or yarn  
- Google Chrome (Chromium-based browser required for the extension)

## **Available Scripts**

In the project directory, you can run:

### **npm start**

Runs the app in the development mode.
Open http://localhost:3000 to view the portal UI in your browser.
The page will reload when you make changes.
You may also see any lint errors in the console.

### **npm test**

Launches the test runner in the interactive watch mode.

### **npm run build**

Builds the extension and web app for production to the build folder.
It correctly bundles the application in production mode and optimizes the build for the best performance.
Your app is ready to be loaded as an unpacked extension in Chrome!

## **Project Structure 🏗️**

root/  
    ├── public/  
    │   ├── index.html  
    │   └── manifest.json (Manifest V3 configuration) 
    ├── src/  
    │   ├── components/ (HUD and Portal UI components) 
    │   ├── background/ (Service workers handling Native REST API calls)
    │   ├── content/ (DOM injection scripts for Google Meet)
    │   ├── services/ (Firebase/Firestore communication) 
    │   ├── App.js  
    │   └── index.js  
    ├── .env  
    ├── .gitignore  
    ├── package.json  
    └── README.md

## **Configuration ⚙️**

To get Sentinel up and running, you'll need to configure a few key environment variables to connect to the cloud database.

### **Environment Variables**

Create a file named `.env` in the root directory of the project. This file will store your configuration details for the centralized synchronization hub. Add the following variables:

REACT_APP_API_KEY='YOUR_API_KEY'  
REACT_APP_AUTH_DOMAIN='YOUR_AUTH_DOMAIN'  
REACT_APP_DATABASE_URL='YOUR_DB_URL'  
REACT_APP_PROJECT_ID='YOUR_PROJECT_ID'
REACT_APP_STORAGE_BUCKET='YOUR_STORAGE_BUCKET'  
# Add other keys here

**Replace** the placeholder values with your actual Firebase/Google Cloud credentials.

### **Firebase Setup**

1. **Create Project:** Create a new project in the Firebase console.  
2. **Register App:** Register your web app to get configuration details.  
3. **Firestore Database:** Enable Firestore as this acts as the centralized synchronization hub for the Live Telemetry Operations.
4. **Authentication:** Set up authentication if enforcing institutional email domain restrictions.

## **Development Guide 🧑‍💻**

### **Local Development**

To run Sentinel locally:

1. Clone the repository: `git clone https://github.com/username/sentinel.git`  
2. Navigate to the project directory: `cd sentinel`  
3. Install dependencies: `npm install`  
4. Start the development server/build watcher: `npm start`
5. Go to `chrome://extensions/` in your browser, enable "Developer mode", and click "Load unpacked". Select your project's `build` folder.

### **Documentation**
For detailed technical specifications, architecture diagrams, and system workflows, please refer to the **Sentinel Documentation.pdf** file included in the repository.

## **Contributing Guide 👋**

We welcome contributions! To contribute:

1. Fork the repository.  
2. Create a new branch for your feature or bug fix.  
3. Make your changes and commit them with descriptive messages.  
4. Push your changes to your fork.  
5. Open a pull request to the main branch of the original repository.

## **Support 🤝**

If you find this project helpful for your institution, please consider giving it a ⭐️!

For support, questions, or feedback, please open an issue on our GitHub repository.

### **Donations**

- [Patreon Link]  
- [PayPal Link]  
- [Buy Me A Coffee Link]

## **Technologies Used 🛠️**

Sentinel leverages the following cutting-edge technologies:

- **Manifest V3 Architecture:** 🧩 The strict underlying framework for the Chrome Extension, utilizing DOM observation and the Chrome Tabs API.
- **Firebase Firestore:** ☁️ Acts as the centralized synchronization hub for telemetry data.
- **Native REST APIs (Fetch):** 🌐 Used to circumvent Manifest V3 service worker limitations for persistent, low-latency telemetry transmission to Google Cloud.
- **HTML/CSS/JS (DOM Manipulation):** 🎨 Used for lightweight, localized UI injection that layers over Google Meet without native styling collisions. 

## **Similar Tools 🔎**

- **Proctorio / Honorlock:** Traditional proctoring tools that often rely on invasive screen capturing and deep system tracking. Sentinel provides a strict privacy-first alternative that tracks *states* rather than substance.
- **Google Meet Native Attendance:** Provides basic participant logs, whereas Sentinel provides continuous empirical engagement metrics, PiP state tracking, and chronological algorithm-based matrices.
