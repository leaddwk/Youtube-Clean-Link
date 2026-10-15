"use strict";
const source = document.getElementById("source");
const result = document.getElementById("result");
const copy = document.getElementById("copy");
const status = document.getElementById("status");
function refresh() {
  const value = source.value.trim();
  let valid = false;
  try { valid = YoutubeCleanLink.isYoutube(new URL(value)); } catch {}
  result.value = valid ? YoutubeCleanLink.cleanUrl(value) : "";
  copy.disabled = !valid;
  const removed = valid ? Math.max(0, value.length - result.value.length) : 0;
  document.getElementById("count").textContent = valid ? (removed ? `${removed}자 줄었어요` : "이미 깔끔해요") : "";
  status.textContent = value && !valid ? "올바른 유튜브 링크를 입력해 주세요." : "";
}
source.addEventListener("input", refresh);
copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(result.value);
    status.textContent = "정리된 링크를 복사했어요.";
  } catch {
    result.focus();
    result.select();
    status.textContent = "자동 복사가 막혔어요. Ctrl+C로 복사해 주세요.";
  }
});
const initialValue = source.value;
chrome.tabs.query({active: true, currentWindow: true}).then(([tab]) => {
  if (source.value !== initialValue) return;
  try {
    if (YoutubeCleanLink.isYoutube(new URL(tab?.url))) { source.value = tab.url; refresh(); }
  } catch {}
}).catch(() => {});
