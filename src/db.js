
//const { MongoClient, ServerApiVersion } = require('mongodb');
import mongo from "mongodb";

let connection_string = "mongodb+srv://evapelko:MongoDBPass@gameart.euyd2.mongodb.net/?retryWrites=true&w=majority&appName=gameart";

let client = new mongo.MongoClient(connection_string);

let db = null;

export default async () => {
  if (db) {
    return db;
  } else {
    try {
      await client.connect();
      console.log("uspješno spajanje");
      db = client.db("gameartdb");
      return db;
    } catch (e) {
      console.error("Error connecting to MongoDB:", e);
      throw e;
    }
  }
};


/* // Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
 */