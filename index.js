const express = require('express')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 3000


app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://bistro-boss:ZtdE6fjy5VWMiGn1@cluster0.ig6ro.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {


    const userdatabase = client.db("bistroBossdb").collection("users");
    const Menudatabase = client.db("bistroBossdb").collection("menudb");
    const cartsdatabase = client.db("bistroBossdb").collection("cartdb");
    
   
    
// jwt releted api
app.post('/jwt', async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.Jwttoken, { expiresIn: '1h' });
  res.send({ token });
})

const verifyToken = (req, res, next) => {
  console.log('inside verify token', req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.Jwttoken, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}
const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email };
  const user = await userdatabase.findOne(query);
  const isAdmin = user?.role === 'admin';
  if (!isAdmin) {
    return res.status(403).send({ message: 'forbidden access' });
  }
  next();
}


// user releted api
    app.post('/users',async(req,res)=>{
      const users = req.body;
      const query = {email:users.email}
      const existinguser = await userdatabase.findOne(query)
      if(existinguser){
        return res.send ({message:'user al ready exist'})
      }
      const result = await userdatabase.insertOne(users)
      res.send(result)
    })
    app.get('/users',verifyToken ,verifyAdmin,async(req,res)=>{
     console.log(req.headers)
      const result = await userdatabase.find().toArray()
      res.send(result)
    })

    app.get('/users/admin/:email', verifyToken,async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userdatabase.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';

      }
      res.send({ admin });
    })


    app.delete('/users/:id',verifyToken ,verifyAdmin,async(req,res)=>{
      const id = req.params.id
      const query = {_id:new ObjectId(id)}
      const result = await userdatabase.deleteOne(query)
      res.send(result)
    })


    app.patch('/users/admin/:id',verifyToken ,verifyAdmin,async(req,res)=>{
      const id = req.params.id
      const filter = {_id:new ObjectId(id)}
      const updateddoc={
        $set:{
           role :'admin'
        }
      }
      const result = await userdatabase.updateOne(filter,updateddoc)
      res.send(result)
    })

    // menu releted api
    app.get('/menu',async (req,res)=>{
        const result = await Menudatabase.find().toArray()
        res.send(result)
    })

    app.post('/carts',async(req,res)=>{
      const cart = req.body;
      const result = await cartsdatabase.insertOne(cart)
      res.send(result)
    })

    app.get('/carts',async(req,res)=>{
      const email = req.query.email
      const query = {email:email}
      const result = await cartsdatabase.find(query).toArray()
      res.send(result)
    })

    app.delete('/carts/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)}
      const result = await cartsdatabase.deleteOne(query)
      res.send(result)
    })
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello welcome bistro World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})