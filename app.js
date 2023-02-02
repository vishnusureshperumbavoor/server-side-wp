const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const mongoose = require("mongoose");
const db = mongoose.connection;
const dotenv = require("dotenv");
dotenv.config();
const mongodb_uri = process.env.MONGODB_URI;
const PORT = process.env.PORT;
const cookieParser = require("cookie-parser");
const session = require("express-session");
const collection = require("./collections");
const fileupload = require("express-fileupload");

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(cookieParser());
app.use(fileupload());

app.set("view engine", "hbs");
app.set("views", "");

mongoose.set("strictQuery", false);
mongoose
  .connect(mongodb_uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((res) => {
    console.log("mongodb connection established");
  })
  .catch((err) => {
    console.log(`error : ${err.message}`);
  });

const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String,
  createdAt: { type: Date, default: new Date() },
});

const User = mongoose.model("User", userSchema);

app.get("/session", (req, res) => {
  res.send(req.session.user);
});

app.get("/signup", (req, res) => {
  if (req.session.user) res.redirect("home", { user: req.session.user });
  else res.sendFile(__dirname + "/signup.html");
});

app.get("/login", (req, res) => {
  if (req.session.user) res.redirect("home", { user: req.session.user });
  else res.sendFile(__dirname + "/login.html");
});

app.get("/", (req, res) => {
  if (req.session.user){
    console.log(req.session.user._id);
    res.render("home", { user: req.session.user });
  }
  else res.redirect("/login");
});

app.post("/signup", urlencodedParser, (req, res) => {
  //console.log(req.files.aiimage);
  const image = req.files.aiimage
  const user = new User(req.body);
  db.collection(collection.USER_COLLECTIONS).insertOne(user, (err, coll) => {
    if (err) console.log(`error ${err}`);
    else {
      console.log(coll);
      image.mv("./images/" + coll.insertedId + ".jpg",(err)=>{
        if(err){
          console.log(`file upload error ${err}`);
        }
        else{
          console.log("successfully uploaded the file");
          res.redirect("/login");
        }
      });
    }
  });
});
app.post("/login", urlencodedParser, (req, res) => {
  db.collection(collection.USER_COLLECTIONS).findOne(
    { username: req.body.username },
    (err, user) => {
      if (err) return console.error(err);
      if (user && user.password === req.body.password) {
        res.cookie(user.username, "username", {
          expires: new Date(Date.now() + 900000),
          httpOnly: true,
        });
        req.session.user = user;
        console.log("Login successful");
        res.redirect("/");
      } else {
        console.log("Invalid username or password");
        res.redirect("/login");
      }
    }
  );
});

app.post("/logout", (req, res) => {
  res.clearCookie(req.session.user.username);
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    } else {
      res.clearCookie("connect.sid");
      res.redirect("/login");
    }
  });
});

app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
