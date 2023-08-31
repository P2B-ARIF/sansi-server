const express = require("express");
const router = express.Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { format } = require("date-fns");

const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@cluster0.cyu4av7.mongodb.net`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

const fns_PP = format(new Date(), "PP");
const fns_P = format(new Date(), "P");
const fns_pp = format(new Date(), "pp");

const secretKey = process.env.SECRET_KEY;
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

//* database and collections here
const database = client.db("sansi");

const users = database.collection("users");
const products = database.collection("products");
const categoryLists = database.collection("categoryLists");

const pending = database.collection("pending");
const fulfilled = database.collection("fulfilled");
const rejected = database.collection("rejected");

const history = database.collection("history");
const control = database.collection("controller");

router.get("/get/popup", async (req, res) => {
	try {
		const result = await control.findOne({
			_id: new ObjectId("64eb40d172ee117f32c45ecf"),
		});
		res.status(201).send({ popUp: result?.popUpMessage });
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

// control
router.put("/update/popup", verifyJWT, async (req, res) => {
	try {
		const message = req.body;
		const result = await control.updateOne(
			{ _id: new ObjectId("64eb40d172ee117f32c45ecf") },
			{ $set: { popUpMessage: message } },
			{ upsert: true },
		);
		res.status(201).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

module.exports = router;
