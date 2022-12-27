const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const mongoose = require("mongoose");
const db = mongoose.connection;
db.on("connected", () => {
  console.log("mongodb connection established");
});
db.on("error", (err) => {
  console.log(`mongodb connection ${err}`);
});

mongoose.connect("mongodb://localhost/gptcpbvr", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const userSchema = new mongoose.Schema({
  name:String,
  username:String,
  password:String,
})
const User = mongoose.model('User',userSchema)

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/registration", urlencodedParser, (req, res) => {
  const user = new User(req.body)
  db.collection("user").insertOne(user,((err,coll)=>{
    if(err)
      console.log(`error ${err}`);
    else 
      console.log(`inserted successfully ${coll}`);
  }));
});

app.listen(3000, () => {
  console.log("Express server listening on port 3000");
});
