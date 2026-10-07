/* Clown Analyzer — native bridge for the Android/iOS (Capacitor) builds.
   Bundled by scripts/build-www.mjs into www/native.bundle.js and only shipped inside the apps.
   The web app talks to it through window.NativeBridge and never imports plugins directly. */
import { Capacitor } from '@capacitor/core';
import { AdMob, AdmobConsentStatus } from '@capacitor-community/admob';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { App } from '@capacitor/app';

const cfg = () => window.APP_CONFIG || {};
const native = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'
const PREMIUM_CACHE = 'premiumActive_v1';

/* ---------- Premium (RevenueCat) ---------- */
let premium = (() => { try { return localStorage.getItem(PREMIUM_CACHE) === '1'; } catch (e) { return false; } })();
let purchasesReady = false;
let packageCache = [];
const premiumListeners = [];

function setPremium(v) {
  v = !!v;
  if (v === premium) return;
  premium = v;
  try { localStorage.setItem(PREMIUM_CACHE, v ? '1' : '0'); } catch (e) {}
  premiumListeners.forEach(f => { try { f(v); } catch (e) {} });
}
function entitled(customerInfo) {
  const ent = (cfg().revenuecat || {}).entitlement || 'premium';
  return !!(customerInfo && customerInfo.entitlements && customerInfo.entitlements.active &&
            customerInfo.entitlements.active[ent]);
}
async function initPurchases() {
  const rc = cfg().revenuecat || {};
  const apiKey = platform === 'ios' ? rc.iosKey : platform === 'android' ? rc.androidKey : '';
  if (!apiKey) return; // Premium not configured yet → stays hidden, everyone is on the free tier
  await Purchases.configure({ apiKey });
  purchasesReady = true;
  await Purchases.addCustomerInfoUpdateListener(ci => setPremium(entitled(ci)));
  const { customerInfo } = await Purchases.getCustomerInfo();
  setPremium(entitled(customerInfo));
}
const PERIOD = { WEEKLY: ['Weekly', ' / week'], MONTHLY: ['Monthly', ' / month'],
  TWO_MONTH: ['2 months', ' / 2 months'], THREE_MONTH: ['3 months', ' / 3 months'],
  SIX_MONTH: ['6 months', ' / 6 months'], ANNUAL: ['Yearly', ' / year'], LIFETIME: ['Lifetime', ' once'] };
async function getPackages() {
  if (!purchasesReady) return [];
  try {
    const offerings = await Purchases.getOfferings();
    const cur = offerings && offerings.current;
    packageCache = cur ? cur.availablePackages : [];
    return packageCache.map(p => {
      const [label, suffix] = PERIOD[p.packageType] || [p.product.title, ''];
      return { id: p.identifier, label, price: p.product.priceString + suffix };
    });
  } catch (e) { console.warn('offerings', e); return []; }
}
async function purchase(id) {
  const p = packageCache.find(x => x.identifier === id);
  if (!p) return { ok: false, error: 'This plan is no longer available' };
  try {
    const r = await Purchases.purchasePackage({ aPackage: p });
    const ok = entitled(r.customerInfo);
    setPremium(ok);
    return { ok };
  } catch (e) {
    const cancelled = !!(e && (e.userCancelled || String(e.code) === '1'));
    return { ok: false, cancelled, error: e && e.message };
  }
}
async function restore() {
  if (!purchasesReady) return { premium: false, error: 'Purchases are not available yet' };
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    const v = entitled(customerInfo);
    setPremium(v);
    return { premium: v };
  } catch (e) { return { premium: false, error: e && e.message }; }
}

/* ---------- Ads (AdMob): one interstitial after a finished review, free tier only ---------- */
let adsInit = null, canRequestAds = true, adLoaded = false, adLoading = null, lastAdAt = 0;
function adUnit() {
  const a = cfg().ads || {};
  return platform === 'ios' ? a.iosInterstitial : a.androidInterstitial;
}
function initAds() {
  if (adsInit) return adsInit;
  adsInit = (async () => {
    await AdMob.initialize({});
    try { // GDPR / UK / Swiss consent through Google's UMP form
      let info = await AdMob.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) info = await AdMob.showConsentForm();
      canRequestAds = info.canRequestAds !== false;
    } catch (e) { console.warn('consent', e); }
    if (platform === 'ios') { // App Tracking Transparency
      try {
        const s = await AdMob.trackingAuthorizationStatus();
        if (s.status === 'notDetermined') await AdMob.requestTrackingAuthorization();
      } catch (e) {}
    }
  })().catch(e => { console.warn('ads init', e); adsInit = null; throw e; });
  return adsInit;
}
async function prepareInterstitial() {
  const a = cfg().ads || {};
  if (!native || premium || !a.enabled || !adUnit()) return;
  try { await initAds(); } catch (e) { return; }
  if (!canRequestAds || adLoaded || adLoading) return;
  adLoading = AdMob.prepareInterstitial({ adId: adUnit(), isTesting: !!a.testing })
    .then(() => { adLoaded = true; console.log('[ads] interstitial loaded'); })
    .catch(e => console.warn('ad load', e))
    .finally(() => { adLoading = null; });
}
async function showInterstitialIfDue() {
  const a = cfg().ads || {};
  if (!native || premium || !a.enabled) return false;
  if (Date.now() - lastAdAt < (a.minIntervalSec || 120) * 1000) return false; // frequency cap
  if (adLoading) await Promise.race([adLoading, new Promise(r => setTimeout(r, 2500))]);
  if (!adLoaded) return false;
  try {
    adLoaded = false;
    await AdMob.showInterstitial();
    lastAdAt = Date.now();
    return true;
  } catch (e) { console.warn('ad show', e); return false; }
}

/* ---------- Native touches ---------- */
async function haptic(kind) {
  if (!native) return;
  try {
    if (kind === 'success') await Haptics.notification({ type: NotificationType.Success });
    else if (kind === 'error') await Haptics.notification({ type: NotificationType.Error });
    else await Haptics.impact({ style: kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light });
  } catch (e) {}
}
async function shareImage(dataUrl, name) {
  try {
    const file = await Filesystem.writeFile({ path: name, data: dataUrl.split(',')[1], directory: Directory.Cache });
    await Share.share({ title: 'My Clown Analyzer report', text: 'How many Clown moves did I play? 🤡',
      files: [file.uri], dialogTitle: 'Share report card' });
    return true;
  } catch (e) {
    if (/cancel/i.test(String(e && e.message))) return true; // user closed the sheet
    console.warn('share', e);
    return false;
  }
}
function minimize() { App.minimizeApp().catch(() => {}); }

/* ---------- Startup ---------- */
let initPromise = null;
function init() {
  if (!native) return Promise.resolve();
  if (initPromise) return initPromise;
  initPromise = (async () => {
    App.addListener('backButton', () => window.dispatchEvent(new Event('native-back')));
    // learn Premium status first (max 4s) so subscribers never see the consent/ATT prompts
    try { await Promise.race([initPurchases(), new Promise(r => setTimeout(r, 4000))]); }
    catch (e) { console.warn('purchases', e); }
    // free tier: consent/ATT once at launch, then preload the first post-review ad
    if (!premium && (cfg().ads || {}).enabled) initAds().then(prepareInterstitial).catch(() => {});
    console.log('[native] ready on ' + platform + (purchasesReady ? ' · purchases on' : ' · purchases off') + (premium ? ' · premium' : ''));
  })();
  return initPromise;
}

window.NativeBridge = {
  init, platform,
  isNative: () => native,
  purchasesAvailable: () => purchasesReady,
  isPremium: () => premium,
  onPremiumChange: f => premiumListeners.push(f),
  getPackages, purchase, restore,
  prepareInterstitial, showInterstitialIfDue,
  haptic, shareImage, minimize
};
