/* Clown Analyzer — app configuration.
   Everything account-specific lives here. Empty values switch the feature off. */
window.APP_CONFIG = {
  // Web-only "Support" link (hidden when empty, always hidden inside the store apps
  // because Apple/Google require in-app purchase for tips). e.g. 'https://github.com/sponsors/SirNonam3'
  supportUrl: '',

  // Privacy-friendly analytics (web only). Create a free site at goatcounter.com and put its
  // code here, e.g. 'clownanalyzer' → https://clownanalyzer.goatcounter.com. Empty = no analytics.
  goatcounter: '',

  // Store apps: an interstitial ad after a finished game review (never for Premium users).
  ads: {
    enabled: true,
    minIntervalSec: 120,       // at most one ad every 2 minutes
    // Google's official TEST ad units — safe to use while developing.
    // Replace with your real AdMob ad unit IDs before publishing (see STORES.md).
    androidInterstitial: 'ca-app-pub-3940256099942544/1033173712',
    iosInterstitial: 'ca-app-pub-3940256099942544/4411468910',
    testing: true              // set false with real ad units
  },

  // Store apps: Premium subscription (ad-free) via RevenueCat. Empty keys = Premium hidden.
  revenuecat: {
    androidKey: '',            // RevenueCat "goog_..." public key
    iosKey: '',                // RevenueCat "appl_..." public key
    entitlement: 'premium'
  }
};
