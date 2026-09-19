import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

async function runTest() {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const [k, ...vArr] = line.split('=');
    if(k && vArr.length > 0) {
      process.env[k.trim()] = vArr.join('=').trim().replace(/^"|"$/g, '');
    }
  });

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  try {
    console.log("1. Initializing Firebase...");
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log("2. Attempting authentication...");
    const userCredential = await signInWithEmailAndPassword(auth, "doctor1@gmail.com", "doctor1@123");
    console.log("✅ Authenticated successfully as:", userCredential.user.uid);

    console.log("3. Writing test patient to Firestore...");
    const docRef = await addDoc(collection(db, "patients"), {
      name: "Test Patient from CLI",
      age: 65,
      phone: "9876543210",
      preferredLanguage: "Tamil",
      createdByDoctorId: userCredential.user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    console.log("✅ Patient successfully saved with ID:", docRef.id);

    console.log("4. Reading patients back...");
    const q = query(collection(db, "patients"), where("createdByDoctorId", "==", userCredential.user.uid));
    const snapshot = await getDocs(q);
    console.log(`✅ Found ${snapshot.size} patients for this doctor.`);

    console.log("All Backend Tests Passed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test Failed:", error);
    process.exit(1);
  }
}

runTest();
