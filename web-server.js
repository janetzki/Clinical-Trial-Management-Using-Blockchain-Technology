const express = require("express");

const app = express();
app.use(express.static(__dirname)); // unsecure, but provides required access to files from various locations

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/web_pages/login.html");
});

app.get("/patient", function (req, res) {
    res.sendFile(__dirname + "/web_pages/patient.html");
});

app.get("/medic", function (req, res) {
    res.sendFile(__dirname + "/web_pages/medic.html");
});

app.listen(80);