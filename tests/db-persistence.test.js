const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const { execSync } = require('child_process');

describe('Database Persistence Tests', () => {
  let client;
  let db;
  const dbName = 'brainbytes_test';
  const url = 'mongodb://localhost:27017';

  beforeAll(async () => {
    client = await MongoClient.connect(url);
    db = client.db(dbName);
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  test('Data persists after container restart', async () => {
    // Insert test data
    const collection = db.collection('messages');
    const testMessage = {
      text: 'Test persistence ' + Date.now(),
      sender: 'user',
      sessionId: 'persistence-test',
      timestamp: new Date(),
    };

    await collection.insertOne(testMessage);

    // Restart the MongoDB container
    execSync('docker-compose restart mongo');

    // Wait for container to be ready
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Reconnect to database
    const newClient = await MongoClient.connect(url);
    const newDb = newClient.db(dbName);

    // Verify data still exists
    const newCollection = newDb.collection('messages');
    const foundMessage = await newCollection.findOne({
      sessionId: 'persistence-test',
      text: testMessage.text,
    });

    expect(foundMessage).not.toBeNull();
    expect(foundMessage.text).toBe(testMessage.text);

    await newClient.close();
  }, 45000);
});
