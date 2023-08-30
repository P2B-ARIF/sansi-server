const express = require("express");
const router = express.Router();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@cluster0.cyu4av7.mongodb.net`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

const secretKey = process.env.SECRET_KEY;

const verifyJWT = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).send("unauthorized access");
	}

	const token = authHeader.split(" ")[1];
	jwt.verify(token, secretKey, function (err, decoded) {
		if (err) {
			return res
				.status(403)
				.send({ access: false, message: "Forbidden Access" });
		}
		req.decoded = decoded;
		next();
	});
};

//* database and collections here
const database = client.db("sansi");

const users = database.collection("users");
const products = database.collection("products");
const categoryLists = database.collection("categoryLists");

router.get("/category", async (req, res) => {
	try {
		const result = await categoryLists.find({}).toArray();
		res.status(201).send(result);
	} catch (err) {
		res.status(501).send({ message: err.message });
	}
});

router.get("/allProducts", async (req, res) => {
	try {
		const result = await products.find({}).toArray();
		const modifiedProducts = result?.map(product => {
			const { stock, ...productWithoutStock } = product;
			return productWithoutStock;
		});
		res.status(201).send(modifiedProducts);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.get("/collection/:category", async (req, res) => {
	try {
		const { category } = req.params;
		const result = await products.find({ category: category }).toArray();
		res.status(201).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.get("/specific/:product_Id", async (req, res) => {
	try {
		const { product_Id } = req.params;
		const result = await products.findOne({ product_Id: product_Id });
		res.status(201).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

module.exports = router;
