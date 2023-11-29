console.log('i am before the firebase initialization')
console.log('i am after initialization')
import initStorage from "./storage/init";
import storage from "./storage";
import recreateContextMenu from "./helpers/recreate-context-menu";
import blockSite from "./helpers/block-site";
console.log('i am inside the firebase.ts')
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue } from "firebase/database"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const userId = 'aa9199b4-3690-11ee-be56-0242ac120002';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAWnT8ocg7Qccj0jzWffWbs7UxqWWRtjHI",
  authDomain: "attentive-d218b.firebaseapp.com",
  databaseURL: "https://attentive-d218b-default-rtdb.firebaseio.com",
  projectId: "attentive-d218b",
  storageBucket: "attentive-d218b.appspot.com",
  messagingSenderId: "380582688751",
  appId: "1:380582688751:web:97195a59487b4a66a8681a"
};

interface sessionSegment {
    startTime: number;
    endTime: number;
    appId: string;
    state: string;
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);

function writeUsageData(segment: sessionSegment) {
    const userSegments = ref(database, `users/${userId}/segments`);
    const pushRef = push(userSegments);
    set(pushRef, segment);
}


const sessionSegment = {
    startTime: new Date(1691745398645).getTime(),
    endTime: new Date(1691745998645).getTime(),
    state: 'focused',
    appId: '123123123'
}

function writeSession() {
    const session = {
        "id": "7299580a-42aa-11ee-be56-0242ac120002",
        "name": "Create relevant tickets for attentive",
        "state": "active",
        "startTime": 1692901096295,
        "toolset": {
            "name": "Desining toolset",
            "allowed": [
                { websiteUrl: "figma.com" },
                { appId: "Mail" },
            ],
        },
        "blocked": [{
            "websiteUrl": "youtube.com",
            "faviconUrl": "https://www.google.com/s2/favicons?sz=128&domain_url=youtube.com"
        }, {
            "appName": "youtube",
        }]
    }
    const userSession = ref(database, `users/${userId}/currentSession`);
    return set(userSession, session);
}

const userSession = ref(database, `users/${userId}/currentSession`);

onValue(userSession, (snapshot) => {
  const sessionValue = snapshot.val();
  console.log('value change receieved');
  console.log(sessionValue);
});
writeUsageData(sessionSegment);
console.log('i am starting firebase')
writeSession().then(() => console.log('i am done'));


let __enabled: boolean;
let __contextMenu: boolean;
let __blocked: string[];

console.log('i am in the background');
initStorage().then(() => {
  storage.get(["enabled", "contextMenu", "blocked"]).then(({ enabled, contextMenu, blocked }) => {
    __enabled = enabled;
    __contextMenu = contextMenu;
    __blocked = blocked;

    recreateContextMenu(__enabled && __contextMenu);
  });

  chrome.storage.local.onChanged.addListener((changes) => {
    if (changes["enabled"]) {
      __enabled = changes["enabled"].newValue as boolean;
    }

    if (changes["contextMenu"]) {
      __contextMenu = changes["contextMenu"].newValue as boolean;
    }

    if (changes["enabled"] || changes["contextMenu"]) {
      recreateContextMenu(__enabled && __contextMenu);
    }

    if (changes["blocked"]) {
      __blocked = changes["blocked"].newValue as string[];
    }
  });
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (!__enabled || !__blocked.length) {
    return;
  }

  const { tabId, url, frameId } = details;
  if (!url || !url.startsWith("http") || frameId !== 0) {
    return;
  }


  blockSite({ blocked: __blocked, tabId, url });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!tabId || !__enabled || !__blocked.length) {
    return;
  }

  const { url } = changeInfo;
  if (!url || !url.startsWith("http")) {
    return;
  }

  blockSite({ blocked: __blocked, tabId, url });
});


interface SessionData {
  tabId: number;
  url: string;
  startTime: number;
  endTime: number | null;
}

let data: { [key: string]: SessionData } = {};
let lastActiveTabId: number | null = null;

chrome.tabs.onActivated.addListener((activeInfo) => {
  const now = Date.now();
  // Update the endTime for the last active tab
  if (lastActiveTabId !== null) {
    for (let key in data) {
      if (data[key].tabId === lastActiveTabId && data[key].endTime === null) {
        let newKey = `${data[key].startTime}:${now}`;
        data[newKey] = { ...data[key], endTime: now };
        delete data[key];
        break;
      }
    }
  }
  chrome.tabs.get(activeInfo.tabId, (tab) => {
      let key = `${now}:0`;

      data[key] = {
          tabId: activeInfo.tabId,
          url: tab.url || '',
          startTime: now,
          endTime: null
      };

      lastActiveTabId = activeInfo.tabId;
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
      for (let key in data) {
          if (data[key].tabId === tabId && data[key].endTime === null) {
              let now = Date.now();
              let newKey = `${data[key].startTime}:${now}`;

              data[newKey] = {
                  ...data[key],
                  endTime: now,
                  url: changeInfo.url!
              };

              delete data[key];
              break;
          }
      }
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  for (let key in data) {
      if (data[key].tabId === tabId && data[key].endTime === null) {
          let now = Date.now();
          let newKey = `${data[key].startTime}:${now}`;

          data[newKey] = {
              ...data[key],
              endTime: now
          };

          delete data[key];
          break;
      }
  }
});

// Periodically save the data to chrome.storage.local to prevent data loss.
setInterval(() => {
  chrome.storage.local.set({ sessionData: data });
}, 3000); // Every 5 minutes

// On startup, restore the data.
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get('sessionData', (result) => {
      if (result.sessionData) {
          data = result.sessionData as { [key: string]: SessionData };
      }
  });
});

chrome.runtime.onMessage.addListener(function(request, sender) {
  if (request.action == "redirectToCustomPage") {
      const tabId = sender.tab?.id || -1;
      chrome.tabs.update(tabId, {url: chrome.runtime.getURL("blocked_page.html")});
  }
});