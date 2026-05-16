import { Client, Account, Databases, ID, Query } from 'appwrite';

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const appwriteClient = client;
export { ID, Query };

// Database and collection IDs
export const DATABASE_ID = 'digitalqrcard';
export const USERS_COLLECTION = 'users';
export const CARDS_COLLECTION = 'cards';
