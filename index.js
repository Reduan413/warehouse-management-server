const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
var jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    console.log("decoded", decoded);
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xoggk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const inventorysCollection = client
      .db("inventorysManagement")
      .collection("inventorys");

    //Authe
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    app.get("/inventory", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = inventorysCollection.find(query);
      let inventorys;
      if (page || size) {
        inventorys = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        inventorys = await cursor.toArray();
      }

      res.send(inventorys);
    });

    app.get("/inventoryCount", async (req, res) => {
      const count = await inventorysCollection.estimatedDocumentCount();
      res.send({ count });
    });

    app.get("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const inventory = await inventorysCollection.findOne(query);
      res.send(inventory);
    });

    //post
    app.post("/inventory", async (req, res) => {
      const inventory = req.body;
      const result = await inventorysCollection.insertOne(inventory);
      res.send(result);
    });

    //PUT
    app.put("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const updatedInventory = req.body;
      console.log(updatedInventory);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          // name:updatedInventory.name,
          // email:updatedInventory.email,
          // price:updatedInventory.price,
          // img:updatedInventory.img,
          // description:updatedInventory.description,
          quantity: updatedInventory.quantity,
          // supplierName:updatedInventory.supplierName,
          sold: updatedInventory.sold,
        },
      };
      const result = await inventorysCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    //delete
    app.delete("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await inventorysCollection.deleteOne(query);
      res.send(result);
    });

    //my inventory
    app.get("/myinventory", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = inventorysCollection.find(query);
        const myInventory = await cursor.toArray();
        res.send(myInventory);
      } else {
        res.status(403).send({ message: "Forbidden access" });
      }
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running inventory management");
});

app.listen(port, () => {
  console.log("listening on port", port);
});
