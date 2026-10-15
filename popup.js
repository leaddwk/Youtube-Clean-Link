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
  document.getElementById("count").textContent = valid ? (removed ? `${removed}�� �پ����` : "�̹� ����ؿ�") : "";
  status.textContent = value && !valid ? "�ùٸ� ��Ʃ�� ��ũ�� �Է��� �ּ���." : "";
}
source.addEventListener("input", refresh);
copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(result.value);
    status.textContent = "������ ��ũ�� �����߾��.";
  } catch {
    result.focus();
    result.select();
    status.textContent = "�ڵ� ���簡 �������. Ctrl+C�� ������ �ּ���.";
  }
});
const initialValue = source.value;
chrome.tabs.query({active: true, currentWindow: true}).then(([tab]) => {
  if (source.value !== initialValue) return;
  try {
    if (YoutubeCleanLink.isYoutube(new URL(tab?.url))) { source.value = tab.url; refresh(); }
  } catch {}
}).catch(() => {});
