// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push } from "firebase/database"
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

const database = getDatabase(app);

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

writeUsageData(sessionSegment);