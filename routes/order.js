const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const router = express.Router();
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@cluster0.cyu4av7.mongodb.net`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

const orders = client.db("products").collection("orders");

router.post("/create-order", async (req, res) => {
	try {
		const order = req.body;
		const result = await orders.insertOne(order);
		return res.status(201).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

module.exports = router;
