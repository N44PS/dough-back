require("dotenv").config();
var express = require("express");
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var routes = require("./routes.js");

app.use(function(req, res, next) {
  res.header(
    "Access-Control-Allow-Origin",
    "https://dough-4f780.firebaseapp.com"
  ); //<-- you can change this with a specific url like http://localhost:4200
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json"
  );
  next();
});

app.use("/api", routes);

var server = app.listen(process.env.PORT || 3000, function() {
  console.log("Listening on port %s...", server.address().port);
});
