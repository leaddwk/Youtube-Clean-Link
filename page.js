(() => {
  "use strict";
  const {cleanUrl, cleanText, cleanShareUrl} = globalThis.YoutubeCleanLink;
  const fields = 'input[readonly], textarea[readonly], input#share-url, textarea#share-url, ytd-unified-share-panel-renderer input, ytd-share-popup-renderer input, yt-share-dialog-renderer input';

  function cleanHref(value) {
    return cleanShareUrl(value, location.href);
  }
  function cleanElement(element) {
    if (!(element instanceof Element)) return;
    if (element.matches("a[href], area[href]")) {
      const old = element.getAttribute("href");
      const next = cleanHref(old);
      if (old !== next) element.setAttribute("href", next);
    }
    if (element.matches(fields)) {
      const old = element.value;
      const next = cleanText(old);
      if (old !== next) element.value = next;
      const attribute = element.getAttribute("value");
      if (attribute && cleanText(attribute) !== attribute) element.setAttribute("value", cleanText(attribute));
    }
  }
  function scan(root) {
    cleanElement(root);
    root.querySelectorAll?.(`a[href], area[href], ${fields}`).forEach(cleanElement);
  }
  // YouTube changes input.value without always changing its HTML attribute.
  // Intercept the native setter so timestamps and regenerated share tokens update immediately.
  for (const type of [HTMLInputElement, HTMLTextAreaElement]) {
    const descriptor = Object.getOwnPropertyDescriptor(type.prototype, "value");
    if (!descriptor?.set || !descriptor.configurable) continue;
    Object.defineProperty(type.prototype, "value", {
      ...descriptor,
      set(value) { descriptor.set.call(this, this.matches(fields) ? cleanText(value) : value); }
    });
  }
  const observer = new MutationObserver(records => {
    const roots = new Set();
    for (const record of records) {
      if (record.type === "attributes") cleanElement(record.target);
      else record.addedNodes.forEach(node => { if (node.nodeType === 1) roots.add(node); });
    }
    for (const root of roots) if (root.isConnected) scan(root);
  });
  observer.observe(document, {subtree: true, childList: true, attributes: true, attributeFilter: ["href", "value", "readonly", "id"]});
  scan(document);
  for (const name of ["pointerover", "pointerdown", "focusin", "contextmenu", "click", "input", "change"]) {
    document.addEventListener(name, event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      cleanElement(target.closest("a[href], area[href]") || target);
      document.querySelectorAll(fields).forEach(cleanElement);
    }, true);
  }

  function cleanHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    let changed = false;
    template.content.querySelectorAll("a[href]").forEach(a => {
      const old = a.getAttribute("href");
      const next = cleanHref(old);
      if (old !== next) { a.setAttribute("href", next); changed = true; }
    });
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const old = walker.currentNode.data;
      const next = cleanText(old);
      if (old !== next) { walker.currentNode.data = next; changed = true; }
    }
    return changed ? template.innerHTML : html;
  }
  // Runs after ordinary document copy handlers, preserving rich text where present.
  window.addEventListener("copy", event => {
    if (!event.clipboardData) return;
    let plain = event.clipboardData.getData("text/plain");
    let html = event.clipboardData.getData("text/html");
    if (!event.defaultPrevented) {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
        if (active.selectionStart === null || active.selectionEnd === null) return;
        plain = active.value.slice(active.selectionStart, active.selectionEnd);
      } else {
        const selection = window.getSelection();
        plain = selection?.toString() || "";
        if (selection?.rangeCount && cleanText(plain) !== plain) {
          const container = document.createElement("div");
          for (let i = 0; i < selection.rangeCount; i++) container.append(selection.getRangeAt(i).cloneContents());
          html = container.innerHTML;
        }
      }
    }
    const next = cleanText(plain);
    const nextHtml = html ? cleanHtml(html) : "";
    if (next === plain && nextHtml === html) return;
    event.clipboardData.setData("text/plain", next);
    if (html) event.clipboardData.setData("text/html", nextHtml);
    event.preventDefault();
  });

  function patchMethod(prototype, key, wrap) {
    const descriptor = prototype && Object.getOwnPropertyDescriptor(prototype, key);
    if (!descriptor?.value || !descriptor.configurable) return;
    Object.defineProperty(prototype, key, {...descriptor, value: wrap(descriptor.value)});
  }
  // Share buttons may build their destination on click instead of using an anchor.
  patchMethod(window, "open", original => function(url, ...args) {
    return Reflect.apply(original, this, [typeof url === "string" ? cleanHref(url) : url, ...args]);
  });
  patchMethod(globalThis.Clipboard?.prototype, "writeText", original => function(text) {
    return Reflect.apply(original, this, [cleanText(text)]);
  });
  // ClipboardItem data remains promised, so the native clipboard call keeps the user gesture.
  patchMethod(globalThis.Clipboard?.prototype, "write", original => function(items) {
    const next = Array.isArray(items) ? items.map(item => {
      if (!item.types.some(type => type === "text/plain" || type === "text/html")) return item;
      const data = Object.fromEntries(item.types.map(type => [type, item.getType(type).then(async blob => {
        if (type !== "text/plain" && type !== "text/html") return blob;
        const text = await blob.text();
        const cleaned = type === "text/html" ? cleanHtml(text) : cleanText(text);
        return cleaned === text ? blob : new Blob([cleaned], {type});
      })]));
      return new ClipboardItem(data, {presentationStyle: item.presentationStyle});
    }) : items;
    return Reflect.apply(original, this, [next]);
  });
  patchMethod(Navigator.prototype, "share", original => function(data) {
    if (!data || typeof data !== "object") return Reflect.apply(original, this, [data]);
    const next = {...data};
    if (typeof next.url === "string") next.url = cleanUrl(next.url, location.href);
    if (typeof next.text === "string") next.text = cleanText(next.text);
    return Reflect.apply(original, this, [next]);
  });
})();
