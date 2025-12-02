// This file is not used in the current client-side application.
// The application currently uses a LocalStorage mock (services/apiService.ts) for data persistence.
// This ensures the app works immediately as a demo/offline-first app without needing a backend server.

/*
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://Vercel-Admin-atlas-rose-flower:<db_password>@atlas-rose-flower.yo6p0cr.mongodb.net/?appName=atlas-rose-flower";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
*/