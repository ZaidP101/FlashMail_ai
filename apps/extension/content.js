const TONES = [
  "Professional",
  "Formal",
  "Casual",
  "Friendly",
  "Polite",
  "Apologetic",
  "Appreciative",
  "Encouraging",
  "Direct",
  "Assertive",
  "Supportive",
  "Empathetic",
  "Sarcastic",
  "Humorous",
];

function getEmailContent() {
  const selectors = [
    ".h7",
    ".a3s.aiL",
    '[role="presentation"]',
    ".gmail_quote",
  ];
  for (const selector of selectors) {
    const content = document.querySelector(selector);
    if (content) return content.innerText.trim();
  }
  return "";
}

function getReplyContent() {
  const selectors = [".Am.aiL.editable"];
  for (const selector of selectors) {
    const reply = document.querySelector(selector);
    if (reply) {
      const clone = reply.cloneNode(true);
      clone
        .querySelectorAll(
          '.gmail_signature, [data-smartmail="gmail_signature"]',
        )
        .forEach((el) => el.remove());
      return clone.innerText.trim();
    }
  }
  return "";
}

function getSignatureElement() {
  const composeBox = getComposeBox();
  if (!composeBox) return null;
  return (
    composeBox.querySelector(".gmail_signature") ||
    composeBox.querySelector('[data-smartmail="gmail_signature"]') ||
    null
  );
}

const SPARKLE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="#fff" d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>';

const CHEVRON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10"><path fill="#fff" d="M7 10l5 5 5-5z"/></svg>';

let selectedTone = "professional";

function createToneMenu(onSelect) {
  const menu = document.createElement("div");
  menu.className = "ai-tone-menu";
  menu.style.display = "none";

  TONES.forEach((tone) => {
    const item = document.createElement("div");
    item.className = "ai-tone-item";
    item.dataset.tone = tone.toLowerCase();
    item.textContent = tone;
    item.addEventListener("click", () => {
      onSelect(tone.toLowerCase());
    });
    menu.appendChild(item);
  });

  return menu;
}

function createAIButton(isReply) {
  const tooltip = isReply
    ? "AI Reply — Draft your reply"
    : "AI Compose — Polish your message";

  const group = document.createElement("div");
  group.className = "ai-button-group";

  const button = document.createElement("div");
  button.className = "T-I J-J5-Ji aoO v7 T-I-atl L3 ai-reply-button";
  button.innerHTML = SPARKLE_SVG;
  button.setAttribute("role", "button");
  button.setAttribute("tabindex", "0");
  button.setAttribute("data-tooltip", tooltip);
  button.setAttribute("aria-label", tooltip);

  const arrow = document.createElement("div");
  arrow.className = "T-I J-J5-Ji aoO v7 T-I-atl L3 ai-tone-arrow";
  arrow.innerHTML = CHEVRON_SVG;
  arrow.setAttribute("role", "button");
  arrow.setAttribute("tabindex", "0");
  arrow.setAttribute("data-tooltip", "Choose tone");
  arrow.setAttribute("aria-label", "Choose tone");
  arrow.style.borderLeft = "1px solid rgba(255,255,255,0.35)";

  const menu = createToneMenu((tone) => {
    selectedTone = tone;
    menu.querySelectorAll(".ai-tone-item").forEach((el) => {
      el.classList.toggle("selected", el.dataset.tone === tone);
    });
    menu.style.display = "none";
  });

  arrow.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = menu.style.display !== "none";
    menu.style.display = isOpen ? "none" : "block";
    if (!isOpen) positionToneMenu(menu, arrow);
  });

  group.appendChild(button);
  group.appendChild(arrow);
  document.body.appendChild(menu);

  return { group, button, menu, arrow };
}

function positionToneMenu(menu, arrow) {
  menu.style.display = "block";
  const rect = arrow.getBoundingClientRect();
  const menuHeight = menu.offsetHeight;
  const menuWidth = menu.offsetWidth;
  const spaceBelow = window.innerHeight - rect.bottom;

  let top = rect.bottom + 4;
  if (spaceBelow < menuHeight + 8) {
    top = Math.max(4, rect.top - menuHeight - 4);
  }

  let left = rect.left;
  if (left + menuWidth > window.innerWidth - 8) {
    left = Math.max(4, window.innerWidth - menuWidth - 8);
  }

  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
}

function findComposeToolbarRow() {
  const rows = document.querySelectorAll("tr.btC");
  const visible = [...rows].filter(
    (el) => el.offsetParent !== null || el.getClientRects().length > 0,
  );
  const pool = visible.length ? visible : [...rows];
  return pool[pool.length - 1] || null;
}

function getComposeBox() {
  const bodySelectors = [
    'div[aria-label="Message Body"]',
    ".Am.aiL.editable",
    'div[role="textbox"][g_editable="true"]',
  ];
  for (const selector of bodySelectors) {
    const matches = document.querySelectorAll(selector);
    if (matches.length) {
      const visible = [...matches].filter(
        (el) => el.offsetParent !== null || el.getClientRects().length > 0,
      );
      const pool = visible.length ? visible : matches;
      return pool[pool.length - 1];
    }
  }
  return null;
}

function getSubjectBox() {
  const subjectSelectors = [
    'input[name="subjectbox"]',
    'input.aoT[name="subjectbox"]',
    'input[aria-label="Subject"]',
    'input[name="subject"]',
  ];
  for (const selector of subjectSelectors) {
    const match = document.querySelector(selector);
    if (match) return match;
  }
  return null;
}

function insertReply(reply) {
  const composeBox = getComposeBox();
  if (!composeBox) return false;

  console.log(
    "[insert] compose box →",
    composeBox.className,
    "| aria-label:",
    composeBox.getAttribute("aria-label"),
    "| id:",
    composeBox.id,
  );

  const signature = getSignatureElement();
  const signatureHtml = signature ? signature.outerHTML : "";

  composeBox.innerText = "";
  composeBox.focus();

  const range = document.createRange();
  range.selectNodeContents(composeBox);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand("insertText", false, reply);

  if (signatureHtml) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = signatureHtml;
    const restored = wrapper.firstChild;
    if (restored) composeBox.appendChild(restored);
  }

  return true;
}

function insertSubject(subject) {
  const subjectBox = getSubjectBox();
  if (!subjectBox || !subject) return false;

  console.log(
    "[insert] subject box →",
    subjectBox.className,
    "| name:",
    subjectBox.name,
    "| id:",
    subjectBox.id,
  );

  subjectBox.focus();

  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  ).set;
  setter.call(subjectBox, subject);
  subjectBox.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: subject,
    }),
  );
  subjectBox.dispatchEvent(new Event("change", { bubbles: true }));

  if (subjectBox.value !== subject) {
    const range = document.createRange();
    range.selectNodeContents(subjectBox);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand("insertText", false, subject);
  }

  return subjectBox.value === subject;
}

function insertCompose(subject, reply) {
  insertSubject(subject);
  return insertReply(reply);
}

function sendToBackground(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}

async function generateAndInsert(payload) {
  const result = await sendToBackground({ type: "generate", payload });
  if (!result.ok) return result;
  const inserted =
    payload.mode === "compose"
      ? insertCompose(result.subject, result.reply)
      : insertReply(result.reply);
  return { ok: inserted, reply: result.reply };
}

async function sendReply() {
  const emailContent = getEmailContent();
  const replyContent = getReplyContent();

  const payload = { emailContent, rawReply: replyContent };
  if (selectedTone) payload.tone = selectedTone;

  return generateAndInsert(payload);
}

async function sendCompose() {
  const draft = getReplyContent();

  const payload = { mode: "compose", rawReply: draft };
  if (selectedTone) payload.tone = selectedTone;

  return generateAndInsert(payload);
}

function getAccountEmail() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["email"], (result) =>
      resolve(result.email || ""),
    );
  });
}

async function polishReply() {
  const hasReceivedEmail = Boolean(getEmailContent());
  const replyContent = getReplyContent();
  const senderName = await getAccountEmail();

  if (!hasReceivedEmail) {
    const payload = { mode: "compose", rawReply: replyContent };
    if (selectedTone) payload.tone = selectedTone;
    if (senderName) payload.senderName = senderName;
    return generateAndInsert(payload);
  }

  const payload = { emailContent: getEmailContent(), rawReply: replyContent };
  if (selectedTone) payload.tone = selectedTone;
  if (senderName) payload.senderName = senderName;

  return generateAndInsert(payload);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "insert-reply") {
    const subjectOk = message.subject ? insertSubject(message.subject) : true;
    const inserted = insertReply(message.reply);
    sendResponse({ ok: inserted, subjectOk });
    return;
  }
  if (message.type === "get-email-content") {
    sendResponse({ ok: true, content: getEmailContent() });
    return;
  }
  if (message.type === "polish-reply") {
    polishReply().then(sendResponse);
    return true;
  }
});

async function injectButton() {
  const existingGroup = document.querySelector(".ai-button-group");
  if (existingGroup) existingGroup.remove();
  document.querySelectorAll(".ai-tone-menu").forEach((el) => el.remove());

  const row = findComposeToolbarRow();
  if (!row) return;

  const deleteCell = row.querySelector("td.gU.a0z");
  if (!deleteCell) return;

  const isReply = Boolean(getEmailContent());
  const { group, button, menu } = createAIButton(isReply);

  button.addEventListener("click", async () => {
    if (button.disabled) return;
    try {
      button.disabled = true;
      button.classList.add("generating");

      const emailContent = getEmailContent();
      const replyContent = getReplyContent();
      const senderName = await getAccountEmail();

      const payload = !emailContent
        ? { mode: "compose", rawReply: replyContent }
        : { emailContent, rawReply: replyContent };
      if (selectedTone) payload.tone = selectedTone;
      if (senderName) payload.senderName = senderName;

      const result = await generateAndInsert(payload);
      if (!result.ok) throw new Error(result.error || "API request failed");
    } catch (error) {
      console.error(error);
      alert(`Failed to generate: ${error.message}`);
    } finally {
      button.disabled = false;
      button.classList.remove("generating");
    }
  });

  const cell = document.createElement("td");
  cell.className = "ai-toolbar-cell gU";
  cell.style.whiteSpace = "nowrap";
  cell.appendChild(group);
  row.insertBefore(cell, deleteCell);
}

document.addEventListener("click", (e) => {
  if (e.target.closest(".ai-tone-menu, .ai-tone-arrow")) return;
  document.querySelectorAll(".ai-tone-menu").forEach((menu) => {
    menu.style.display = "none";
  });
});

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const addedNodes = Array.from(mutation.addedNodes);
    const hasComposeElements = addedNodes.some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node.matches('.aDh, .btC, [role="dialog"]') ||
          node.querySelector('.aDh, .btC, [role="dialog"]')),
    );
    if (hasComposeElements) {
      setTimeout(injectButton, 500);
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
