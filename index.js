const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();
dotenv.config();

const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://scic-task-client.vercel.app",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.dmwxvyo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("scic-task");
    const userCollection = db.collection("users");
    const productCollection = db.collection("products");

    app.get("/", (req, res) => {
      res.send("Hello");
    });

    app.post("/user", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/products", async (req, res) => {
      const { page = 1, limit = 10, search = "", category, sortBy } = req.query;
      const query = {
        name: { $regex: search, $options: "i" },
        ...(category && { category }),
      };
      let sortOptions = {};
      if (sortBy === "price") sortOptions.price = 1;
      if (sortBy === "price_desc") sortOptions.price = -1;
      if (sortBy === "date") sortOptions.createdAt = -1;

      try {
        const products = await productCollection
          .find(query)
          .sort(sortOptions)
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .toArray();

        const total = await productCollection.countDocuments(query);

        res.json({
          products,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is on ${port}`);
});
