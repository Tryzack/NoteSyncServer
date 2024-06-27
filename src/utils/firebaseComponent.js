import admin from "firebase-admin";
import serviceAccount from "../../serviceAccountKey.json" with {type: "json"};
import { v4 as uuidv4 } from "uuid";

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://spotify-a9c33.appspot.com" //storage bucket url
});

const bucket = admin.storage().bucket();

export async function uploadSong(file) {
    const uuid = uuidv4();
    try {
        await bucket.upload(file, { destination: `images/${uuid}.mp3` });
        const options = {
            action: "read",
            expires: Date.now() + 1000 * 60 * 60 * 24 * 30 // a month Date.now() + 1000 * 60 * 60 * 24 * 30
        }
        const signedUrl = await bucket.file(`images/${uuid}.mp3`).getSignedUrl(options);
        return { success: true, url: signedUrl[0], refId: uuid};

    } catch (error) {
        return { error: error };
    }
}