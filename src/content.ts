import { BlockMessageBody, Message } from "./types/messages";

const stickyWarningSection = document.createElement('div');
const warningText = document.createElement('a')
warningText.textContent = 'You may be loosing your attention';

stickyWarningSection.setAttribute('id', 'navbar');
stickyWarningSection.classList.add('sticky')
stickyWarningSection.appendChild(warningText)

let __request: Message;

const blockedHtml = `<!DOCTYPE html>
<head>
    <title>Focus Page</title>
    <link rel="stylesheet" type="text/css" href="styles.css">
</head>
<body class="blocked">
    <div class="blocked container">
        <h1 class="blocked">Your focus is unbroken</h1>
        <h2 class="blocked">To keep it that way, we've sent twitter on a break</h2>
    </div>
</body>
`

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
        document.body.insertBefore(stickyWarningSection, document.body.firstChild)
        clearInterval(intervalId)
        return true;
    }

    if (__request.rule.type == "block") {
        const message = `<span id="url">${(__request.messageBody as BlockMessageBody).url}</span> <b>was blocked</b> by rule <span id="rule">${__request.rule}</span>`;
        (document.querySelector('html') as HTMLHtmlElement).innerHTML = blockedHtml 
        console.log('setting timeout')
        clearInterval(intervalId)
        return true;
    }
}, 1000)

chrome.runtime.onMessage.addListener(function (request: Message, sender, sendResponse) {
    console.log(JSON.stringify(request))
    __request = request
});