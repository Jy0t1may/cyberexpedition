# Cyber Security Expedition

This is an Android app for keeping up with cybersecurity news and planning a route through security certifications. I started building it to support my own journey toward a cybersecurity internship or job: I wanted a practical way to read relevant reporting, compare learning options, and track what I had completed. I am sharing the project in case it helps other people finding their way into the field.

The app is a learning and portfolio project, not an official certification guide or a replacement for the original news publishers.

## What it does

- **Checks for latest news:** Refresh four cybersecurity feeds on demand: tl;dr sec, Risky Bulletin, SANS Internet Storm Center, and KrebsOnSecurity. Previously saved posts remain available if a feed cannot be reached.
- **Find relevant posts:** Search headlines and previews, then filter by source and topics such as vulnerabilities, AI security, breaches, cloud, identity, policy, malware, AppSec, and ransomware. Topic labels inferred from text are approximate.
- **Read the original reporting:** You can click a story to open the publisher's own page through an in-app browser. Security Expedition does not reproduce full articles. Some publishers may require a subscription or login.
- **Explore certifications:** Search a 482-item catalogue adapted from [Paul Jerimy's Security Certification Roadmap](https://pauljerimy.com/security-certification-roadmap/), filter by career area, and open issuer pages. Catalogue entries are a starting point, not an official or continuously verified price and exam database; unavailable details are labelled as such.
- **Build a study roadmap:** Add certifications, change their order, open available details, and mark courses complete. The roadmap is saved automatically on the device, without an account.

## How it works
The interface uses HTML, CSS, and JavaScript packaged for Android with Capacitor. Native HTTP requests retrieve RSS/Atom feeds; the app merges posts by URL and keeps a local news cache. Capacitor Preferences stores selected roadmap IDs, order, and completion state. The Browser plugin opens full articles on their publishers' sites. The UI is designed for small screens, system-bar safe areas, keyboard access, and reduced-motion preferences.

## Build locally
Requirements: Node.js 22 or newer, npm, Android Studio, and an Android SDK. From the repository root:
```sh
npm ci
npm test
npm run build
npx cap sync android
npx cap open android
```


News links and previews lead to reporting by [tl;dr sec](https://tldrsec.com/), [Risky Bulletin](https://risky.biz/), [SANS Internet Storm Center](https://isc.sans.edu/), and [KrebsOnSecurity](https://krebsonsecurity.com/). The certification catalogue is derived from [Paul Jerimy's roadmap](https://pauljerimy.com/security-certification-roadmap/). Neither the publishers nor Paul Jerimy endorse this app. Their articles, names, and third-party materials remain their own; this repository is not a licence to republish them.

## Contact
© 2026 J.M. All rights reserved. [Email](mailto:jyotirmay.mondal@efrei.net) · [GitHub](https://github.com/Jy0t1may) · [LinkedIn](https://www.linkedin.com/in/jyotirmay-mondal)
