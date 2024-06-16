//DB Component for MongoDB
import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

/**
 * Connect to MongoDB
 * @returns {Promise<void>}
 */
async function connectToDB() {
	try {
		await client.connect();
	} catch (error) {
		console.error("Error connecting to MongoDB", error);
	}
}

/**
 * Close MongoDB connection
 * @returns {Promise<void>}
 */
async function closeDB() {
	try {
		await client.close();
	} catch (error) {
		console.error("Error closing MongoDB connection", error);
	}
}

/**
 * Get the MongoDB database
 * @returns {Promise<Db>}
 */
async function getDB() {
	return client.db(process.env.MONGODB_DB);
}

/**
 * Find one document in a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} filter - Filter for the document
 * @returns {Promise<Object>}
 */
export async function findOne(collectionName, filter) {
	try {
		await connectToDB();
		const db = await getDB();
		const collection = db.collection(collectionName);
		const result = await collection.findOne(filter);
		closeDB();
		return result;
	} catch (error) {
		console.error("Error finding data", error);
	}
}

/**
 * Find documents in a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} filter - Filter for the documents
 * @returns {Promise<Array>}
 */
export async function find(collectionName, filter) {
	try {
		await connectToDB();
		const db = await getDB();
		const collection = db.collection(collectionName);
		const result = await collection.find(filter).toArray();
		closeDB();
		return result;
	} catch (error) {
		console.error("Error finding data", error);
	}
}

/**
 * Insert one document into a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} data - Data to insert
 * @returns {Promise<InsertOneResult>}
 */
export async function insertOne(collectionName, data) {
	try {
		await connectToDB();
		const db = await getDB();
		const collection = db.collection(collectionName);
		const result = await collection.insertOne(data);
		closeDB();
		return result;
	} catch (error) {
		console.error("Error inserting data", error);
	}
}

/**
 * Insert many documents into a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object[]} data - Data to insert
 * @returns {Promise<InsertManyResult>}
 */
export async function insertMany(collectionName, data) {
	try {
		await connectToDB();
		const db = await getDB();
		const collection = db.collection(collectionName);
		await collection.insertMany(data);
		const result = await collection.insertMany(data);
		closeDB();
		return result;
	} catch (error) {
		console.error("Error inserting data", error);
	}
}

/**
 * update one document in a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} filter - Filter for the document to update
 * @param {Object} data - Data to update
 * @returns {Promise<UpdateResult>}
 */
export async function updateOne(collectionName, filter, data) {
	try {
		await connectToDB();
		const db = await getDB();
		const collection = db.collection(collectionName);
		const result = await collection.updateOne(filter, { $set: data });
		closeDB();
		return result;
	} catch (error) {
		console.error("Error updating data", error);
	}
}

/**
 * Delete one document from a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} filter - Filter for the document to delete
 * @returns {Promise<DeleteResult>}
 */
export async function deleteOne(collectionName, filter) {
	try {
		await connectToDB();
		const db = await getDB();
		const collection = db.collection(collectionName);
		await collection.deleteOne(filter);
		const result = await collection.deleteOne(filter);
		closeDB();
		return result;
	} catch (error) {
		console.error("Error deleting data", error);
	}
}

/**
 * Get collection from database
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<Collection>}
 */
export async function getCollection(collectionName) {
	try {
		await connectToDB();
		const db = await getDB();
		closeDB();
		return db.collection(collectionName);
	} catch (error) {
		console.error("Error getting collection", error);
	}
}
