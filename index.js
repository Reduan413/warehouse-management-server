const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require('cors');
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xoggk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run(){
    try{
        await client.connect();
        const inventorysCollection = client.db("inventorysManagement").collection("inventorys");

        app.get("/inventory", async(req, res) =>{
            const query = {};
            const cursor = inventorysCollection.find(query);
            const inventorys = await cursor.toArray();
            res.send(inventorys);
        })

        app.get("/inventory/:id", async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const inventory = await inventorysCollection.findOne(query);
            res.send(inventory);
        })

    }finally{}
}
run().catch(console.dir);


app.get('/',(req, res) => {
    res.send('Running inventory management')
})

app.listen(port, ()=>{
    console.log('listening on port', port);
});