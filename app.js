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

app.use(
  session({ secret: "keyboard cat", resave: false, saveUninitialized: true })
);

app.use(cookieParser());

app.set("view engine", "hbs");
app.set("views", "");

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
  createdAt: { type: Date, default: new Date() },
});

const User = mongoose.model("User", userSchema);

app.get("/registration", (req, res) => {
  if (req.session.user) res.redirect("home", { user: req.session.user });
  else res.sendFile(__dirname + "/index.html");
});

app.get("/login", (req, res) => {
  if (req.session.user) res.redirect("home", { user: req.session.user });
  else res.sendFile(__dirname + "/login.html");
});

app.get("/", (req, res) => {
  if (req.session.user) {
    res.render("home", { user: req.session.user });
  } else res.redirect("/login");
});

app.post("/registration", urlencodedParser, (req, res) => {
  const user = new User(req.body);
  db.collection("userdetails").insertOne(user, (err, coll) => {
    if (err) console.log(`error ${err}`);
    else {
      console.log("successfully inserted");
      res.redirect("/login");
    }
  });
});
app.post("/login", urlencodedParser, (req, res) => {
  db.collection("userdetails").findOne(
    { username: req.body.username },
    (err, user) => {
      if (err) return console.error(err);
      if (user && user.password === req.body.password) {
        //res.cookie("session", "abc123", { expires: new Date(Date.now() + 30000) });
        req.session.authenticated = true;
        res.cookie("username", "user", {
          expires: new Date(Date.now() + 900000),
          httpOnly: true,
        });
        req.session.user = user;
        console.log("Login successful");
        res.redirect("/");
      } else {
        console.log("Invalid username or password");
      }
    }
  );
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      res.sendStatus(500);
    } else {
      res.clearCookie("connect.sid");
      res.redirect("/login");
    }
  });
  res.clearCookie("username");
});

app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
