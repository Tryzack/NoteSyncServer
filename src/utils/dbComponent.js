//DB Component for MongoDB
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
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
export async function connectToDB() {
	try {
		await client.connect();
		return {};
	} catch (error) {
		console.error("Error connecting to MongoDB", error);
		return { error: "Internal server error" };
	}
}

/**
 * Close MongoDB connection
 * @returns {Promise<void>}
 */
export async function closeDB() {
	try {
		await client.close();
		return {};
	} catch (error) {
		console.error("Error closing MongoDB connection", error);
		return { error: "Internal server error" };
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
 * @returns {Promise<Object>} - The document found
 */
export async function findOne(collectionName, filter) {
	try {
		const db = await getDB();
		const collection = db.collection(collectionName);
		const result = await collection.findOne(filter);
		return result || {};
	} catch (error) {
		console.error("Error finding data", error);
		return { error: "Internal server error" };
	}
}

/**
 * Find documents in a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} filter - Filter for the documents
 * @param {Object} sort - Sort for the documents for example {name: 1} for ascending order
 * @param {Number} limit - Limit the number of documents returned for example 10
 * @param {Number} skip - Skip the first n documents for example 10
 * @returns {Promise<Array>} - The documents found
 */
export async function find(collectionName, filter, sort = null, limit = 10000000000, skip = 0) {
	try {
		const db = await getDB();
		const collection = db.collection(collectionName);
		const result = await collection.find(filter).sort(sort).skip(skip).limit(limit).toArray();
		return result;
	} catch (error) {
		console.error("Error finding data", error);
		return { error: "Internal server error" };
	}
}

/**
 * Insert one document into a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} data - Document to insert
 * @returns {Promise<InsertOneResult>} - The result of the insert operation
 */
export async function insertOne(collectionName, data) {
	try {
		const db = await getDB();
		const collection = db.collection(collectionName);
		const result = await collection.insertOne(data);
		return result;
	} catch (error) {
		console.error("Error inserting data", error);
		return { error: "Internal server error" };
	}
}

/**
 * Insert many documents into a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object[]} data - Array of documents to insert
 * @returns {Promise<InsertManyResult>} - The result of the insert operation
 */
export async function insertMany(collectionName, data) {
	try {
		const db = await getDB();
		const collection = db.collection(collectionName);
		const result = await collection.insertMany(data);
		return result;
	} catch (error) {
		console.error("Error inserting data", error);
		return { error: "Internal server error" };
	}
}

/**
 * update one document in a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} filter - Filter for the document to update
 * @param {Object} data - Data to update
 * @returns {Promise<UpdateResult>} - The result of the update operation
 */
export async function updateOne(collectionName, filter, data) {
	try {
		const db = await getDB();
		const collection = db.collection(collectionName);
		const result = await collection.updateOne(filter, { $set: data });
		return result;
	} catch (error) {
		console.error("Error updating data", error);
		return { error: "Internal server error" };
	}
}

/**
 * Delete one document from a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} filter - Filter for the document to delete
 * @returns {Promise<DeleteResult>} - The result of the delete operation
 */
export async function deleteOne(collectionName, filter) {
	try {
		const db = await getDB();
		const collection = db.collection(collectionName);
		await collection.deleteOne(filter);
		const DeleteResult = await collection.deleteOne(filter);
		return DeleteResult;
	} catch (error) {
		console.error("Error deleting data", error);
		return { error: "Internal server error" };
	}
}

/**
 * Get collection from database
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<getCollection>} - The collection
 */
export async function getCollection(collectionName) {
	try {
		const db = await getDB();
		return db.collection(collectionName);
	} catch (error) {
		console.error("Error getting collection", error);
		return { error: "Internal server error" };
	}
}

export async function checkUserPermissions(id) {
	const db = await getDB();
	const collection = db.collection("users");
	const user = await collection.findOne({ _id: ObjectId(id) });
	if (!user) {
		return { error: "User not found", status: 404 };
	}
	if (!user.admin) {
		return { error: "User not authorized", status: 401 };
	}
	return {};
}
