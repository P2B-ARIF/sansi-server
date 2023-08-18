const express = require("express");
const router = express.Router();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@cluster0.cyu4av7.mongodb.net`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

const getSecure = async (req, res, next) => {
	const secure = req.headers.authorization;
	if (secure) {
		if (secure.split(" ")[1] === "p2b.business.info@gmail.com") {
			next();
		} else {
			res.status(500).json({ message: "LoL You Can't" });
		}
	} else {
		res.status(500).json({ message: "LoL You Can't" });
	}
};

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

const products = client.db("products").collection("product");
const categoryLists = client.db("products").collection("categoryLists");

router.post("/create", async (req, res) => {
	try {
		const data = req.body;
		console.log(data, "data");
		// const createProduct = {...data, }

		const result = await products.insertOne(data);
		res.status(201).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.post("/create_category", async (req, res) => {
	try {
		const data = req.body;
		console.log(data, "data");
		const result = await categoryLists.insertOne(data);
		res.status(201).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.get("/category", async (req, res) => {
	try {
		const result = await categoryLists.find({}).toArray();
		res.status(201).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.get("/allProducts", getSecure, async (req, res) => {
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

router.get("/collection/:category", getSecure, async (req, res) => {
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
