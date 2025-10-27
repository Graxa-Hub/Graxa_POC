var express = require("express");
var path = require("path"); // ✅ IMPORTAR path
var router = express.Router();

router.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "../../public/views/index2.html"));
});

module.exports = router;
