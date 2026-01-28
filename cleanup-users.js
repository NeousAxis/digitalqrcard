// Script to delete all Firebase Auth users EXCEPT cyrileger@gmail.com
// Project: digitalqrcard-8fdb8 ONLY

const admin = require('firebase-admin');

// Use the specific service account for digitalqrcard-8fdb8
const serviceAccount = require('./digitalqrcard-8fdb8-75b384dab706.json');

// Verify we're using the correct project
if (serviceAccount.project_id !== 'digitalqrcard-8fdb8') {
    console.error('ERROR: Wrong project! Expected digitalqrcard-8fdb8, got:', serviceAccount.project_id);
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'digitalqrcard-8fdb8'
});

const KEEP_EMAIL = 'cyrileger@gmail.com';

async function deleteAllUsersExcept() {
    console.log('=== Firebase Auth Cleanup for digitalqrcard-8fdb8 ===');
    console.log('Will DELETE all users EXCEPT:', KEEP_EMAIL);
    console.log('');

    let nextPageToken;
    let deletedCount = 0;
    let keptCount = 0;

    do {
        const listResult = await admin.auth().listUsers(1000, nextPageToken);

        for (const user of listResult.users) {
            if (user.email === KEEP_EMAIL) {
                console.log('KEEPING:', user.email);
                keptCount++;
            } else {
                console.log('DELETING:', user.email || user.uid);
                await admin.auth().deleteUser(user.uid);
                deletedCount++;
            }
        }

        nextPageToken = listResult.pageToken;
    } while (nextPageToken);

    console.log('');
    console.log('=== DONE ===');
    console.log('Deleted:', deletedCount, 'users');
    console.log('Kept:', keptCount, 'users');
}

deleteAllUsersExcept()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
