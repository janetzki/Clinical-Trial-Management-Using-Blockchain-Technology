const express = require("express");
const path = require("path");

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname + "/public"));
app.set("view engine", "html");

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/public/login.html");
});

app.listen(80);