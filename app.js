const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const mongoose = require("mongoose");
const db = mongoose.connection;
const dotenv = require("dotenv")
dotenv.config()
const mongodb_uri = process.env.MONGODB_URI
const PORT = process.env.PORT
db.on("connected", () => {
  console.log("mongodb connection established");
});

db.on("error", (err) => {
  console.log(`mongodb connection error`);
  console.log(`${err}`);
});
mongoose.set("strictQuery", false);

mongoose.connect(mongodb_uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/signup.html");
});

app.post("/registration", urlencodedParser, (req, res) => {
  const user = new User(req.body);
  db.collection("userdetails").insertOne(user, (err, coll) => {
    if (err) console.log(`error ${err}`);
    else{
      console.log('successfully inserted');
      res.send(`inserted successfully ${coll}`);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
