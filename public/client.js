const socket = io({ transports: ["websocket"] });

let mode = "multi";

const usernameInput = document.getElementById("username");
const joinBtn = document.getElementById("joinBtn");
const multiBtn = document.getElementById("multiBtn");
const aiBtn = document.getElementById("aiBtn");
const chatBox = document.getElementById("chatBox");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const typingRow = document.getElementById("typingRow");

const toBottomBtn = document.getElementById("toBottom");
const newCountEl = document.getElementById("newCount");
let unseen = 0;

const newMsgPopup = document.createElement('div');
newMsgPopup.className = 'new-msg-popup';
newMsgPopup.textContent = 'New message!';
document.body.appendChild(newMsgPopup);

// ============ SCROLL LOGIC ============

function isNearBottom() {
    return chatBox.scrollTop + chatBox.clientHeight >= chatBox.scrollHeight - 12;
}

function showPopup() {
    if (isNearBottom()) return;
    newMsgPopup.classList.add('show');
    newMsgPopup.classList.remove('hide');
}
function hidePopup() {
    newMsgPopup.classList.remove('show');
    newMsgPopup.classList.add('hide');
}
newMsgPopup.onclick = () => {
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    unseen = 0;
    updateCounter();
    hidePopup();
};

function showToBottom() { toBottomBtn.classList.add("show"); }
function hideToBottom() { toBottomBtn.classList.remove("show"); }
toBottomBtn.onclick = () => {
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    unseen = 0;
    updateCounter();
    hideToBottom();
};
function updateCounter() {
    if (unseen <= 0) {
        newCountEl.style.display = "none";
    } else {
        newCountEl.style.display = "inline-grid";
        newCountEl.textContent = unseen > 99 ? "99+" : unseen;
    }
}
chatBox.addEventListener("scroll", () => {
    if (isNearBottom()) {
        unseen = 0;
        updateCounter();
        hideToBottom();
        hidePopup();
    }
});

// ============= /SCROLL LOGIC ===========

// JOIN BTN
joinBtn.onclick = () => {
    const name = usernameInput.value.trim();
    if (!name) return alert("Naam daalo");
    socket.emit("join", name);
    usernameInput.disabled = true;
    joinBtn.disabled = true;
};

// MODE TOGGLE
multiBtn.onclick = () => {
    mode = "multi";
    multiBtn.classList.add("active");
    aiBtn.classList.remove("active");
};
aiBtn.onclick = () => {
    mode = "ai";
    aiBtn.classList.add("active");
    multiBtn.classList.remove("active");
};

// SEND
sendBtn.onclick = send;
msgInput.addEventListener("keydown", e => {
    if (e.key === "Enter") send();
});

function send() {
    const msg = msgInput.value.trim();
    if (!msg) return;
    addMessage("You", msg, "user");
    if (mode === "multi") {
        socket.emit("chat_message", msg);
    } else {
        typingRow.style.display = "block";
        socket.emit("ai_query", msg);
    }
    msgInput.value = "";
}

// SOCKET EVENTS
socket.on("system_message", msg => addMessage("System", msg, "bot"));
socket.on("chat_message", data => addMessage(data.from, data.text, "remote"));
socket.on("ai_response", data => {
    typingRow.style.display = "none";
    addMessage("AI", data.text, "bot");
});

// ADD MESSAGE -- SCROLL LOGIC INCLUDED HERE
function addMessage(from, text, type) {
    const el = document.createElement("div");
    el.className = "msg " + type;
    el.innerHTML = `
        <div class="avatar">${from[0].toUpperCase()}</div>
        <div>
            <div class="bubble">${escapeHtml(text)}</div>
            <div class="meta">${from}</div>
        </div>
    `;
    chatBox.appendChild(el);

    if (isNearBottom()) {
        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
        hidePopup();
    } else {
        unseen++;
        updateCounter();
        showToBottom();
        showPopup();
    }
}

// UTILS
function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
