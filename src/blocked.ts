import storage from "./storage";
import findRule from "./helpers/find-rule";
import * as counterHelper from "./helpers/counter";
import getBlockedUrl from "./helpers/get-blocked-url";
import { Message } from "./types/messages";

interface BlockSiteOptions {
  blocked: string[]
  tabId: number
  url: string
}

async function sendMessage(tabId: number, message: Message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log(tab)
  chrome.tabs.sendMessage(tab.id || 2, message)
}

window.addEventListener("DOMContentLoaded", async () => {
  console.log('i am in DOMContentLoaded')
});