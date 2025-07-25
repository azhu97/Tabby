"use strict";
function renderTabs() {
    chrome.storage.sync.get("closedTabs", (data) => {
        const closedTabs = data.closedTabs || [];
        const list = document.getElementById("tab-list");
        list.innerHTML = "";
        if (closedTabs.length === 0) {
            list.innerHTML = `<p style="margin-left: 8px; margin-top:0px">No closed tabs found.</p>`;
            return;
        }
        closedTabs.forEach((tab, index) => {
            const item = document.createElement("div");
            item.className = "tab-item";
            const link = document.createElement("a");
            link.href = "#";
            link.textContent = tab.title;
            link.onclick = () => {
                chrome.tabs.create({ url: tab.url });
            };
            const removeBtn = document.createElement("button");
            removeBtn.textContent = "🗑️";
            removeBtn.onclick = () => removeTab(index);
            item.appendChild(link);
            item.appendChild(removeBtn);
            list.appendChild(item);
        });
    });
}
function removeTab(index) {
    chrome.storage.sync.get("closedTabs", (data) => {
        const tabs = data.closedTabs || [];
        tabs.splice(index, 1);
        chrome.storage.sync.set({ closedTabs: tabs }, renderTabs);
    });
}
function clearAllTabs() {
    chrome.storage.sync.set({ closedTabs: [] }, renderTabs);
}
// Load saved timeout value
chrome.storage.sync.get("timeoutMinutes", (data) => {
    const timeoutInput = document.getElementById("timeout");
    const timeoutLabel = document.getElementById("timeout-label");
    const timeoutValue = data.timeoutMinutes ?? 30;
    timeoutInput.value = timeoutValue.toString();
    if (timeoutLabel) {
        timeoutLabel.textContent = `Current timeout: ${timeoutValue} minute${timeoutValue === 1 ? "" : "s"}`;
    }
});
// Save timeout value'
document.getElementById("save-timeout")?.addEventListener("click", () => {
    const timeoutInput = document.getElementById("timeout");
    const timeout = parseInt(timeoutInput.value, 10);
    if (!isNaN(timeout) && timeout > 0) {
        chrome.storage.sync.set({ timeoutMinutes: timeout }, () => {
            const timeoutLabel = document.getElementById("timeout-label");
            if (timeoutLabel) {
                timeoutLabel.textContent = `Current timeout: ${timeout} minute${timeout === 1 ? "" : "s"}`;
            }
        });
    }
});
// stop resume buttom
document.getElementById("stop-resume")?.addEventListener("click", (event) => {
    const button = event.target;
    const currentText = button.textContent?.trim();
    if (currentText === "Running") {
        chrome.alarms.clear("checkTabs", (wasCleared) => {
            if (wasCleared) {
                console.log("Timer cleared");
                button.textContent = "Stopped";
                button.style.backgroundColor = "red";
            }
            else {
                console.log("Alarm wasn't active");
            }
        });
    }
    else {
        chrome.alarms.get("checkTabs", (alarm) => {
            if (alarm) {
                console.log("Alarm already running");
            }
            else {
                console.log("Alarm created");
                chrome.alarms.create("checkTabs", { periodInMinutes: 0.5 });
                button.textContent = "Running";
                button.style.backgroundColor = "green";
            }
        });
    }
});
document.addEventListener("DOMContentLoaded", () => {
    renderTabs();
    setupStopResumeButton();
    const clearBtn = document.getElementById("clear-all");
    if (clearBtn) {
        clearBtn.addEventListener("click", clearAllTabs);
    }
});
function setupStopResumeButton() {
    const button = document.getElementById("stop-resume");
    if (!button)
        return;
    chrome.alarms.get("checkTabs", (alarm) => {
        if (alarm) {
            button.textContent = "Running";
            button.style.backgroundColor = "green";
        }
        else {
            button.textContent = "Stopped";
            button.style.backgroundColor = "red";
        }
    });
}
