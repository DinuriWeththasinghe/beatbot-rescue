const firebaseConfig = {
  apiKey: "AIzaSyCgrCZUnObSdcPojyvNUONAbVAnn18vi8Q",
  authDomain: "beatbot-rescue.firebaseapp.com",
  projectId: "beatbot-rescue",
  storageBucket: "beatbot-rescue.firebasestorage.app",
  messagingSenderId: "398636935280",
  appId: "1:398636935280:web:fa07175a90d5c97090ecb5",
  measurementId: "G-MZZVZ8F2TK"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();