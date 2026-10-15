/* Shared by the popup and the page; no network or extension APIs. */
(() => {
  "use strict";
  const tracking = new Set([
    "si", "feature", "pp", "ab_channel", "fbclid", "gclid", "dclid",
    "msclkid", "igshid", "mc_cid", "mc_eid", "embeds_referring_euri",
    "embeds_referring_origin", "source_ve_path", "app", "persist_app",
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "utm_id", "utm_source_platform", "utm_creative_format", "utm_marketing_tactic"
  ]);
  function isYoutube(url) {
    const host = url.hostname.toLowerCase();
    return ["http:", "https:"].includes(url.protocol) &&
      ["youtube.com", "youtu.be", "youtube-nocookie.com"].some(
        domain => host === domain || host.endsWith("." + domain)
      );
  }
  function cleanUrl(value, base) {
    if (typeof value !== "string") return value;
    let url;
    try { url = new URL(value, base); } catch { return value; }
    if (!isYoutube(url)) return value;
    const hashIndex = value.indexOf("#");
    const head = hashIndex < 0 ? value : value.slice(0, hashIndex);
    const hash = hashIndex < 0 ? "" : value.slice(hashIndex);
    const queryIndex = head.indexOf("?");
    if (queryIndex < 0) return value;
    // Short share links only need their timestamp. Unknown share tokens are removed too.
    const shortVideo = (url.hostname === "youtu.be" && /^\/[^/]+\/?$/.test(url.pathname)) ||
      /^\/(shorts|live)\/[^/]+\/?$/.test(url.pathname);
    const parts = head.slice(queryIndex + 1).split("&");
    const kept = parts.filter(part => {
      let key;
      try { key = decodeURIComponent(part.split("=", 1)[0].replace(/\+/g, " ")).toLowerCase(); }
      catch { return !shortVideo; }
      return shortVideo ? key === "t" : !tracking.has(key) && !key.startsWith("utm_");
    });
    if (kept.length === parts.length) return value;
    return head.slice(0, queryIndex) + (kept.length ? "?" + kept.join("&") : "") + hash;
  }
  function cleanText(value) {
    if (typeof value !== "string") return value;
    return value.replace(/https?:\/\/[^\s<>"'`]+/gi, token => {
      const suffix = token.match(/[.,!;:)\]}]+$/)?.[0] || "";
      const core = suffix ? token.slice(0, -suffix.length) : token;
      return cleanUrl(core) + suffix;
    });
  }
  const socialHosts = new Set([
    "facebook.com", "www.facebook.com", "m.facebook.com", "messenger.com", "www.messenger.com",
    "twitter.com", "www.twitter.com", "x.com", "www.x.com", "api.whatsapp.com", "web.whatsapp.com",
    "whatsapp.com", "www.whatsapp.com", "wa.me", "messages.google.com", "www.reddit.com",
    "www.linkedin.com", "www.pinterest.com", "www.tumblr.com"
  ]);
  function cleanShareUrl(value, base, depth = 0) {
    if (typeof value !== "string") return value;
    const direct = cleanUrl(value, base);
    if (direct !== value) return direct;
    if (depth > 3) return value;
    let url;
    try { url = new URL(value, base); } catch { return value; }
    const nativeShare = ["sms:", "smsto:", "mailto:", "whatsapp:", "fb-messenger:"].includes(url.protocol);
    if (!nativeShare && (!socialHosts.has(url.hostname) || !["https:", "http:"].includes(url.protocol))) return value;
    let changed = false;
    const entries = [...url.searchParams].map(([key, old]) => {
      const next = cleanText(cleanShareUrl(old, undefined, depth + 1));
      if (next !== old) changed = true;
      return [key, next];
    });
    if (!changed) return value;
    url.search = new URLSearchParams(entries).toString();
    return url.href;
  }
  const api = Object.freeze({isYoutube, cleanUrl, cleanText, cleanShareUrl, trackingParams: Object.freeze([...tracking])});
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else Object.defineProperty(globalThis, "YoutubeCleanLink", {value: api, configurable: true});
})();
