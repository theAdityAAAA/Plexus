const mongoose = require("mongoose");

const MAX_FIND_LIMIT = 1000;
const DEFAULT_FIND_LIMIT = 50;

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const parseJsonField = (value, fallback, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid JSON in ${fieldName}: ${error.message}`);
  }
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
};

const parseLimit = (value) => {
  const parsed = Number.parseInt(value ?? DEFAULT_FIND_LIMIT, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_FIND_LIMIT;
  }

  return Math.min(parsed, MAX_FIND_LIMIT);
};

const assertCollectionName = (collection) => {
  if (!collection || typeof collection !== "string" || collection.trim() === "") {
    throw new Error("Collection name is required");
  }

  const normalized = collection.trim();

  if (!/^[a-zA-Z0-9_.-]+$/.test(normalized)) {
    throw new Error("Collection name contains unsupported characters");
  }

  if (normalized.startsWith("system.")) {
    throw new Error("System collections cannot be modified through Mongo nodes");
  }

  return normalized;
};

const assertObject = (value, fieldName) => {
  if (!isPlainObject(value)) {
    throw new Error(`${fieldName} must be a JSON object`);
  }
};

const assertNonEmptyFilter = (filter, operation, allowCollectionWide) => {
  if (filter === null || filter === undefined) {
    throw new Error(`${operation} filter cannot be null or undefined`);
  }

  assertObject(filter, `${operation} filter`);

  if (Object.keys(filter).length === 0 && !allowCollectionWide) {
    throw new Error(
      `${operation} filter cannot be empty. Enable the explicit collection-wide option to continue.`
    );
  }
};

const getCollection = (collectionName) => {
  if (!mongoose.connection.db) {
    throw new Error("MongoDB connection is not ready");
  }

  return mongoose.connection.db.collection(collectionName);
};

const normalizeUpdateDocument = (updateDoc) => {
  assertObject(updateDoc, "Update document");

  if (Object.keys(updateDoc).length === 0) {
    throw new Error("Update document cannot be empty");
  }

  const hasOperator = Object.keys(updateDoc).some((key) => key.startsWith("$"));

  return hasOperator ? updateDoc : { $set: updateDoc };
};

const mongoFind = async (config = {}) => {
  const collectionName = assertCollectionName(config.collection);
  const filter = parseJsonField(config.filter ?? config.query, {}, "filter");
  const projection = parseJsonField(config.projection, {}, "projection");
  const sort = parseJsonField(config.sort, {}, "sort");
  const limit = parseLimit(config.limit);

  assertObject(filter, "Find filter");
  assertObject(projection, "Find projection");
  assertObject(sort, "Find sort");

  const collection = getCollection(collectionName);
  const documents = await collection
    .find(filter, { projection })
    .sort(sort)
    .limit(limit)
    .toArray();

  return {
    operation: "find",
    collection: collectionName,
    filter,
    projection,
    sort,
    limit,
    count: documents.length,
    documents,
    results: documents
  };
};

const mongoInsert = async (config = {}, context = {}) => {
  const collectionName = assertCollectionName(config.collection);
  const document = parseJsonField(
    config.document ?? config.data,
    context.input || {},
    "document"
  );

  assertObject(document, "Insert document");

  const collection = getCollection(collectionName);
  const result = await collection.insertOne(document);

  return {
    operation: "insert",
    collection: collectionName,
    acknowledged: result.acknowledged,
    insertedId: result.insertedId,
    success: result.acknowledged
  };
};

const mongoUpdate = async (config = {}) => {
  const collectionName = assertCollectionName(config.collection);
  const filter = parseJsonField(config.filter, {}, "filter");
  const rawUpdate = parseJsonField(config.update, {}, "update");
  const upsert = parseBoolean(config.upsert);
  const allowCollectionWide = parseBoolean(
    config.allowCollectionWideUpdate || config.allowEmptyFilter
  );

  assertNonEmptyFilter(filter, "Update", allowCollectionWide);
  const update = normalizeUpdateDocument(rawUpdate);

  const collection = getCollection(collectionName);
  const result = await collection.updateMany(filter, update, { upsert });

  return {
    operation: "update",
    collection: collectionName,
    filter,
    update,
    upsert,
    acknowledged: result.acknowledged,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedCount: result.upsertedCount || 0,
    upsertedId: result.upsertedId || null,
    success: result.acknowledged
  };
};

const mongoDelete = async (config = {}) => {
  const collectionName = assertCollectionName(config.collection);
  const filter = parseJsonField(config.filter, {}, "filter");

  assertNonEmptyFilter(filter, "Delete", false);

  const collection = getCollection(collectionName);
  const result = await collection.deleteMany(filter);

  return {
    operation: "delete",
    collection: collectionName,
    filter,
    acknowledged: result.acknowledged,
    deletedCount: result.deletedCount,
    success: result.acknowledged
  };
};

module.exports = {
  mongoFind,
  mongoInsert,
  mongoUpdate,
  mongoDelete
};
