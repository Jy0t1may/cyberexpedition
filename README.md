# Cyber Security Expedition

**Cyber Security Expedition** is an offline-ready Android app for following cybersecurity news, exploring security certifications, and personal study planning. Engineered with vanilla JavaScript, Capacitor, and an enterprise DevSecOps CI/CD pipeline enforcing secure code commits.

---

## Features

### 1. Curated Security News & Offline Reader
- **Multi-Feed Aggregation:** Synchronizes on demand with leading security publications: *tl;dr sec*, *Risky Bulletin*, *SANS Internet Storm Center*, and *KrebsOnSecurity*.
- **Offline Digest & Caching:** Previously retrieved news is safely cached in device storage (`news.json`), enabling reading even without an active internet connection.
- **In-App Story Reader:** Read concise digests, publication metadata, and heuristic category tags directly in-app, with the option to launch the original publisher source via in-app browser.
- **Bookmarks:** Bookmark crucial stories to read later or reference during studies, persisted locally via `@capacitor/preferences`.

### 2. Certification Roadmap & Study Tracker
- **480+ Certification Directory:** Derived from Paul Jerimy's Security Certification Roadmap, categorizing certifications across 9 career domains (Offensive Security, Defensive Security, Engineering, Network, AppSec, IAM, Governance, Audit, Asset & Privacy).
- **Interactive Roadmap Planner:** Add target certifications, adjust their study order, view estimated study hours, and check off completed milestones.
- **Progress Tracking & Analytics:** Real-time visual progress bar tracking completion percentage and total estimated study hours.
- **Zero-Account Local Persistence:** Saved automatically on-device using Capacitor Preferences without requiring a backend account or collecting telemetry.

### 3. Search & Topic Filtering
- **Keyword Search:** Instant full-text search across article headlines, publishers, and previews.
- **Domain & Tag Filtering:** Heuristic classification into vulnerabilities, AI security, breaches, cloud, identity, policy, malware, AppSec, and ransomware.
- **Dedicated Bookmark Filter:** Instant toggle to view all saved stories with dynamic badge counter.

---

## DevSecOps Pipeline & Quality Gates

The repository features an automated GitHub Actions DevSecOps CI/CD pipeline (`.github/workflows/devsecops.yml`) ensuring security and quality across every pull request and commit:

```
Commit / PR Opened
      │
      ▼
┌────────────────────────────────────────────────────────┐
│ 1. Secret Scanning (Gitleaks)                          │
│    Detects committed secrets, tokens, & *.jks files    │
│                                                        │
│ 2. Code Quality & Linting                              │
│    Node syntax and ESM integrity check (npm run lint)  │
│                                                        │
│ 3. Automated Unit Testing & Coverage                   │
│    Native Node test runner (npm run test:coverage)     │
│                                                        │
│ 4. SCA Dependency Audit                                │
│    Automated vulnerability scanning (npm audit)        │
│                                                        │
│ 5. CodeQL Static Analysis (SAST)                       │
│    Deep semantic security analysis for JS/TS           │
│                                                        │
│ 6. Android Build Verification                          │
│    JDK 17 + Android SDK Gradle assembleDebug check     │
└────────────────────────────────────────────────────────┘
```

---

## Local Development & Verification

### Prerequisites
- Node.js 22+
- npm 10+
- Android Studio & Android SDK (for native builds)

### Quick Start
```sh
# 1. Install dependencies
npm ci

# 2. Run lint & code quality checks
npm run lint

# 3. Run unit tests with code coverage report
npm run test:coverage

# 4. Build web bundle
npm run build

# 5. Sync Capacitor Android project
npx cap sync android

# 6. Open or build Android project
npx cap open android
```

---

## Architecture & Security Principles
- **Minimal Attack Surface:** Pure vanilla ESM with no bloated frontend frameworks or unnecessary dependencies.
- **Strict Content Security:** In-app browser sandboxing for external links with protocol validation (`http:`, `https:` only; disallowing `javascript:`, `file:` protocols).
- **Hardened Git Hygiene:** Keystores (`*.jks`, `*.keystore`) and sensitive local archives are strictly blocked in `.gitignore` and enforced via Gitleaks secret scanning.

---

## Contact
© 2026 J.M. All rights reserved. [Email](mailto:jyotirmay.mondal@efrei.net) · [GitHub](https://github.com/Jy0t1may) · [LinkedIn](https://www.linkedin.com/in/jyotirmay-mondal)
