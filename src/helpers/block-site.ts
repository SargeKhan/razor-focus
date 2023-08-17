import storage from "../storage";
import findRule from "./find-rule";
import * as counterHelper from "./counter";
import getBlockedUrl from "./get-blocked-url";
import { Message } from "../types/messages";

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

export default async (options: BlockSiteOptions) => {
  console.log('i am in the block site file')
  const { blocked, tabId, url } = options;
  if (!blocked.length || !tabId || !url.startsWith("http")) {
    return;
  }

  const foundRule = findRule(url, blocked);

  console.log("foundRule")
  console.log(foundRule)
  console.log('i am in the find rule')
  if (!foundRule || foundRule.type === "allow") {
    console.log('no need to block anything')
    storage.get(["counter"]).then(({ counter }) => {
      counterHelper.flushObsoleteEntries({ blocked, counter });
      storage.set({ counter });
    });
    return;
  }

  if (foundRule && foundRule.type === "warn") {
    const message: Message = {
      rule: foundRule,
      messageBody: {
        url
      }

    }
    console.log('sending warn message');
    setTimeout(() => sendMessage(tabId, message), 2000);

    return;
  }

  const { counter, counterShow, counterPeriod, resolution } = await storage.get(["counter", "counterShow", "counterPeriod", "resolution"]);
  counterHelper.flushObsoleteEntries({ blocked, counter });

  const timeStamp = Date.now();
  const count = counterHelper.add(foundRule.path, timeStamp, {
    counter,
    countFromTimeStamp: counterHelper.counterPeriodToTimeStamp(counterPeriod, new Date().getTime()),
  });

  storage.set({ counter });

  const message: Message = {
    rule: foundRule,
    messageBody: {
      url,
      count,
    }
  }

  console.log('sending error message', tabId);
  setTimeout(() => sendMessage(tabId, message), 2000);
};
