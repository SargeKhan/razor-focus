import { BlockMessageBody, Message } from "./types/messages";
const stickyWarningSection = document.createElement('div');
const warningText = document.createElement('a')
warningText.textContent = 'You may be loosing your attention';

stickyWarningSection.setAttribute('id', 'navbar');
stickyWarningSection.classList.add('sticky')
stickyWarningSection.appendChild(warningText)

let __request: Message;

function addDraggableCard() {
  const style = document.createElement("style");
  style.textContent = `
      .card-attentive {
        position: fixed;
        top: 20px;
        right: 20px;  /* Set the initial position to the top right corner */
        width: 250px;
        background-color: #ffffff;
        border: 1px solid #ccc;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        cursor: grab;
      }

      .card-header-attentive {
        background-color: #3498db;
        color: #fff;
        padding: 10px;
        font-weight: bold;
      }

      .card-content-attentive {
        padding: 15px;
      }
      #draggableCard-attentive {
        z-index: 9999;
      }
    `;
  document.head.appendChild(style);
  const cardContainer: HTMLDivElement = document.createElement("div");
  cardContainer.classList.add("card-attentive");
  cardContainer.id = "draggableCard-attentive";

  const cardHeader: HTMLDivElement = document.createElement("div");
  cardHeader.classList.add("card-header-attentive");
  cardHeader.textContent = "Focus, bitch";
  cardContainer.appendChild(cardHeader);

  const cardContent: HTMLDivElement = document.createElement("div");
  cardContent.classList.add("card-content-attentive");
  cardContent.innerHTML = "<p>You are not doing what you are supposed to, right?.</p>";
  cardContainer.appendChild(cardContent);

  document.body.appendChild(cardContainer);

  let isDragging: boolean = false;
  let offsetX: number, offsetY: number;

  cardContainer.addEventListener("mousedown", (e: MouseEvent) => {
    isDragging = true;
    offsetX = e.clientX - cardContainer.getBoundingClientRect().left;
    offsetY = e.clientY - cardContainer.getBoundingClientRect().top;
    cardContainer.style.cursor = "grabbing";
  });

  document.addEventListener("mousemove", (e: MouseEvent) => {
    if (isDragging) {
      cardContainer.style.left = e.clientX - offsetX + "px";
      cardContainer.style.top = e.clientY - offsetY + "px";
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    cardContainer.style.cursor = "grab";
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  console.log('i am waiting until the content is loaded')
});

const intervalId = setInterval(() => {
  console.log('i am being called');
  if (!__request) {
    console.log('the background task hasnt called yet');
    return true;
  }
  if (!__request.rule) {
    console.log('Message received without the rule')
    return true;
  }

  if (__request.rule.type == "warn") {
    // Adjust top position of existing fixed position elements
    Array.from(document.querySelectorAll('body *')).forEach(el => {
      const htmlElement = el as HTMLElement
      if (window.getComputedStyle(htmlElement).position === 'fixed' && htmlElement.getBoundingClientRect().top < 50) {
        htmlElement.style.top = `${(parseInt(window.getComputedStyle(el).top) || 0) + 50}px`;
      }
    });

    addDraggableCard();

    clearInterval(intervalId)
  }

  if (__request.rule.type == "block") {
    chrome.runtime.sendMessage({action: "redirectToCustomPage"});
    clearInterval(intervalId)
    return true;
  }
}, 1000)

chrome.runtime.onMessage.addListener(function (request: Message, sender, sendResponse) {
  console.log(JSON.stringify(request))
  __request = request
});

// content.ts
let sessionStartTime: number = Date.now();
console.log(sessionStartTime)
let currentUrl: string = window.location.href;

// Listen for changes in the URL
function trackPageVisit(url: string): void {
  // Calculate session duration and send message to background script
  const sessionDuration = Date.now() - sessionStartTime;
  chrome.runtime.sendMessage({
    action: "sessionEnded",
    url: currentUrl,
    duration: sessionDuration,
  });

  // Start a new session
  sessionStartTime = Date.now();
  currentUrl = url;
}

// Run the tracking function when the page loads or when the URL changes
trackPageVisit(currentUrl);

// Listen for changes in the URL (for single-page apps)
window.addEventListener("hashchange", () => {
  trackPageVisit(window.location.href);
});