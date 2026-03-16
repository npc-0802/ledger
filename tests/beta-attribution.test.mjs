// Unit tests for beta attribution capture, persistence, and event plumbing.
// Tests the pure logic without requiring a browser environment.

// Minimal browser globals shim for testing
const _storage = {};
const _dataLayer = [];
globalThis.window = {
  dataLayer: _dataLayer,
  location: { search: '' },
};
globalThis.localStorage = {
  getItem: (k) => _storage[k] ?? null,
  setItem: (k, v) => { _storage[k] = v; },
  removeItem: (k) => { delete _storage[k]; },
};
globalThis.document = { referrer: '' };

// Import after globals are set
const { persistBetaAttributionFromUrl, getStoredBetaAttribution, track, pushAnalyticsEvent, buildFeedbackFormUrl, trackFeedbackFormOpened } = await import('../src/analytics.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; }
  else { failed++; console.error(`  FAIL: ${label}`); }
}

function section(name) { console.log(`\n── ${name} ──`); }

function reset() {
  delete _storage['palatemap_beta_attribution'];
  _dataLayer.length = 0;
}

// ── Attribution persistence ──

section('UTM capture and persistence');

reset();
window.location = { search: '?utm_source=reddit&utm_medium=organic&utm_campaign=beta_launch&utm_content=r_film' };
persistBetaAttributionFromUrl();
const attr = getStoredBetaAttribution();
assert(attr !== null, 'attribution stored');
assert(attr.beta_source === 'reddit', 'beta_source = reddit');
assert(attr.beta_subreddit === 'r_film', 'beta_subreddit = r_film');
assert(attr.utm_source === 'reddit', 'utm_source preserved');
assert(attr.utm_medium === 'organic', 'utm_medium preserved');
assert(attr.utm_campaign === 'beta_launch', 'utm_campaign preserved');
assert(attr.utm_content === 'r_film', 'utm_content preserved');
assert(typeof attr.first_seen_at === 'number', 'first_seen_at is timestamp');

section('Does not overwrite with empty URL');

const originalTs = attr.first_seen_at;
window.location = { search: '' };
persistBetaAttributionFromUrl();
const attr2 = getStoredBetaAttribution();
assert(attr2.beta_source === 'reddit', 'still reddit after bare URL');
assert(attr2.first_seen_at === originalTs, 'first_seen_at unchanged');

section('Updates with new UTM params');

window.location = { search: '?utm_source=twitter&utm_content=filmtwit' };
persistBetaAttributionFromUrl();
const attr3 = getStoredBetaAttribution();
assert(attr3.beta_source === 'twitter', 'updated to twitter');
assert(attr3.beta_subreddit === 'filmtwit', 'updated subreddit');
assert(attr3.first_seen_at === originalTs, 'preserves original first_seen_at');

// ── Event plumbing ──

section('track() merges attribution');

reset();
window.location = { search: '?utm_source=reddit&utm_content=r_truefilm' };
persistBetaAttributionFromUrl();
_dataLayer.length = 0;

track('test_event', { screen_name: 'test' });
assert(_dataLayer.length === 1, 'one event pushed');
assert(_dataLayer[0].event === 'test_event', 'event name correct');
assert(_dataLayer[0].screen_name === 'test', 'custom param present');
assert(_dataLayer[0].beta_source === 'reddit', 'beta_source merged');
assert(_dataLayer[0].beta_subreddit === 'r_truefilm', 'beta_subreddit merged');

section('pushAnalyticsEvent() works identically');

_dataLayer.length = 0;
pushAnalyticsEvent('pm_landing_view', { screen_name: 'landing' });
assert(_dataLayer.length === 1, 'event pushed');
assert(_dataLayer[0].event === 'pm_landing_view', 'milestone event name');
assert(_dataLayer[0].beta_source === 'reddit', 'attribution in milestone event');

section('track() works without attribution');

reset();
_dataLayer.length = 0;
track('no_attr_event', { foo: 'bar' });
assert(_dataLayer.length === 1, 'event pushed without attribution');
assert(_dataLayer[0].beta_source === undefined, 'no beta_source when no attribution');
assert(_dataLayer[0].foo === 'bar', 'custom param still present');

// ── Feedback form URL ──

section('Feedback form URL includes attribution');

reset();
window.location = { search: '?utm_source=reddit&utm_campaign=beta_v2&utm_content=r_letterboxd' };
persistBetaAttributionFromUrl();
_dataLayer.length = 0;

const url = buildFeedbackFormUrl();
assert(url.includes('entry.1000000001=reddit'), 'form URL has beta_source');
assert(url.includes('entry.1000000002=r_letterboxd'), 'form URL has beta_subreddit');
assert(url.includes('entry.1000000003=beta_v2'), 'form URL has utm_campaign');
assert(_dataLayer.length === 0, 'buildFeedbackFormUrl does NOT fire event');

trackFeedbackFormOpened();
assert(_dataLayer.length === 1, 'trackFeedbackFormOpened fires event');
assert(_dataLayer[0].event === 'pm_feedback_form_opened', 'correct event name');
assert(_dataLayer[0].form_name === 'beta_feedback', 'form_name param');
assert(_dataLayer[0].beta_source === 'reddit', 'attribution merged into event');

section('Feedback form URL without attribution returns base URL');

reset();
_dataLayer.length = 0;
const bareUrl = buildFeedbackFormUrl();
assert(bareUrl.includes('viewform'), 'returns base form URL');
assert(!bareUrl.includes('entry.'), 'no prefill params without attribution');

// ── Summary ──
console.log(`\n══════════════════════════════`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) { console.log('SOME TESTS FAILED'); process.exit(1); }
else { console.log('ALL TESTS PASSED'); }
