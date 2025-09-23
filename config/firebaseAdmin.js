const admin = require('firebase-admin');

if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('✅ Firebase admin initialized from FIREBASE_SERVICE_ACCOUNT_JSON');
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            // When GOOGLE_APPLICATION_CREDENTIALS points to a file path, the SDK will pick it up automatically
            admin.initializeApp();
            console.log('✅ Firebase admin initialized using GOOGLE_APPLICATION_CREDENTIALS');
        } else {
            console.warn('⚠️ Firebase admin not initialized: no service account provided');
        }
    } catch (err) {
        console.error('Failed to initialize firebase-admin:', err);
    }
}

module.exports = admin;
