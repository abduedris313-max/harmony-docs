import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(
  app,
  (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-pdftomarkdowncon-1e93dfab-46b3-4152-b8d5-dc320556cfad'
);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/documents');
googleProvider.addScope('https://www.googleapis.com/auth/documents.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Test connection on boot according to Firebase Integration Skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();
