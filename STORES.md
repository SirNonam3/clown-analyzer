# Publishing Clown Analyzer — Google Play + App Store

One codebase builds three things: the **website** (GitHub Pages, repo root), the
**Android app** (`android/`) and the **iOS app** (`ios/`). The apps are Capacitor 8 shells
around the same `index.html`; `scripts/build-www.mjs` packs it into `www/` with the
native bridge (`native/bridge.js` → ads, Premium, haptics, share sheet, back button).

## Everyday workflow
```
npm install          # once
npm run sync         # after any change to index.html / config.js / bridge.js
git push             # GitHub Actions builds the Android APK + iOS app and smoke-tests both
```
Every push produces a downloadable **debug APK** (Actions → latest run → Artifacts →
`clown-analyzer-android-debug`) you can install on any Android phone for testing
(allow "install unknown apps"). Ads in it are Google **test ads** (labelled "Test Ad").

## Accounts you need
| Account | Cost | Used for |
|---|---|---|
| Google Play Console | $25 once | publishing the Android app |
| Apple Developer Program | $99 / year | publishing the iOS app (available in Turkey, pays to Turkish banks) |
| Google AdMob | free | the ad after each game review |
| RevenueCat | free tier | the Premium (ad-free) subscription on both stores |

## Placeholders to replace before release
| What | Where | Now |
|---|---|---|
| AdMob Android **app** id | `android/app/src/main/res/values/strings.xml` → `admob_app_id` | Google test id |
| AdMob iOS **app** id | `ios/App/App/Info.plist` → `GADApplicationIdentifier` | Google test id |
| AdMob interstitial **ad unit** ids | `config.js` → `ads.androidInterstitial` / `ads.iosInterstitial` | Google test units |
| Test mode off | `config.js` → `ads.testing: false` | `true` |
| RevenueCat public keys | `config.js` → `revenuecat.androidKey` / `iosKey` | empty (Premium hidden) |
| Website support link (optional) | `config.js` → `supportUrl` | empty (hidden) |
| Website analytics (optional) | `config.js` → `goatcounter` | empty (off) |

Never put a **real** ad unit in a build you tap yourself — clicking your own live ads can get the
AdMob account banned. Keep `testing: true` while developing.

## 1. AdMob (ads after reviews)
1. admob.google.com → **Apps → Add app** twice (Android + iOS, "not published yet" is fine).
2. In each app: **Ad units → Interstitial**. Copy the app ids (`ca-app-pub-…~…`) and
   ad-unit ids (`ca-app-pub-…/…`) into the places in the table above.
3. **Privacy & messaging → GDPR**: create and publish a consent message (the app shows it
   automatically to EEA/UK users). Optionally an **IDFA explainer** message for iOS.
4. **app-ads.txt**: AdMob asks you to host it at the root of the website you list in the stores.
   A GitHub *project* site can't serve the domain root — either create a repo named
   `SirNonam3.github.io` containing just `app-ads.txt`, or use a custom domain.

The app already: asks for consent (Google UMP), shows Apple's tracking prompt on iOS, preloads
the ad at launch, shows it right after a review finishes, at most once every 2 minutes
(`ads.minIntervalSec`), and never for Premium users.

## 2. Premium = ad-free subscription (RevenueCat)
1. Create a subscription product in **both** stores, e.g. `premium_monthly` (and optionally
   `premium_yearly`). Suggested price: $2.99–3.99 / month.
2. revenuecat.com → new project → add the **Android** app (package `io.github.sirnonam3.clownanalyzer`,
   upload a Play service-account key) and the **iOS** app (same bundle id, App Store Connect
   in-app-purchase key).
3. Create an **entitlement** named `premium`, attach both products, and put them in the
   **default offering** (Monthly / Annual packages).
4. Copy the two **public SDK keys** (`goog_…`, `appl_…`) into `config.js`.

As soon as keys are set, a **⭐ Go ad-free** button appears in the app header with the paywall
(prices come from the stores, plus *Restore purchases* and the required legal text).

## 3. Google Play release
1. Create an **upload key** once and keep it safe (never commit it — losing it blocks updates):
   `keytool -genkey -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`
2. Build the signed bundle (Android Studio → *Build → Generate Signed App Bundle*, or
   `npx cap build android --androidreleasetype AAB --keystorepath upload.jks --keystorealias upload ...`).
   Ask Claude to add a signed-release job to GitHub Actions using repository secrets instead.
3. Raise `versionCode` in `android/app/build.gradle` for every upload.
4. Play Console: privacy policy URL `https://sirnonam3.github.io/clown-analyzer/privacy.html`,
   **Ads: yes**, **Data safety**: device or other IDs + app interactions (AdMob), purchase history
   (subscriptions); target audience 13+.
5. **New personal developer accounts must run a closed test with at least 12 testers for
   14 days** before production access. Start this early (friends' Gmail addresses work).

## 4. App Store release
1. Building/signing needs Xcode — no Mac required: Claude can add a GitHub Actions job that
   signs and uploads to **TestFlight** once you have an App Store Connect API key.
2. App Store Connect → new app, bundle id `io.github.sirnonam3.clownanalyzer`.
3. **Agreements, Tax and Banking**: sign the Paid Apps agreement and add your bank (needed for
   subscriptions).
4. **App Privacy** labels: *Identifiers → Device ID* and *Usage Data → Advertising Data*
   (third-party advertising, AdMob); *Purchases* (RevenueCat). Not used for tracking unless the
   user allows it in the ATT prompt.
5. Screenshots for 6.9" and 6.5" iPhones, subscription metadata + review screenshot.
6. Review notes tip: "Chess analysis runs fully on-device with the Stockfish engine; games can be
   imported from Chess.com / Lichess; results saved locally." (helps with guideline 4.2).

## Licences to keep visible
Stockfish (GPL-3.0) — the footer links its source; chess.js (BSD); Lichess opening data (CC0).
