const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/auth");

router.get("/promoters", authenticateToken, userController.getPromoters);

module.exports = router;