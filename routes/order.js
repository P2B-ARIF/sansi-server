const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const router = express.Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");
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

//* database and collections here
const database = client.db("sansi");

const products = database.collection("products");
const pending = database.collection("pending");
const fulfilled = database.collection("fulfilled");
const rejected = database.collection("rejected");
const control = database.collection("controller");

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

router.get("/get/allMyOrders", verifyJWT, async (req, res) => {
	try {
		const email = req.decoded.email;
		const pen = await pending.find({ email: email }).toArray();
		const ful = await fulfilled.find({ email: email }).toArray();
		const rej = await rejected.find({ email: email }).toArray();

		res.status(201).send({
			pending: pen?.length,
			fulfilled: ful?.length,
			rejected: rej?.length,
		});
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.patch("/cancel", verifyJWT, async (req, res) => {
	try {
		const { id, product_Id } = req.query;
		const find = await pending.findOne({ _id: new ObjectId(id) });
		const { _id, order, issueDate, ...rest } = find;

		const findProduct = find.order.find(o => o.product_Id === product_Id);
		const reject = {
			...rest,
			status: "cancelled",
			order: [findProduct],
			cancelInfo: {
				author: "user",
				// name: find?.user?.name,
				rejectedDate: {
					date: new Date(),
					fns: {
						fns_PP,
						fns_P,
						fns_pp,
					},
				},
			},
		};
		const insert = await rejected.insertOne(reject);

		if (insert.acknowledged) {
			if (find?.order?.length > 1) {
				const result = await pending.updateOne(
					{ _id: new ObjectId(id) }, // Replace with your document _id
					{ $pull: { order: { product_Id: product_Id } } },
				);
				return res.status(200).send(result);
			} else {
				const result = await pending.deleteOne({ _id: new ObjectId(id) });
				return res.status(200).send(result);
			}
		}
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.get("/getAllOrder", verifyJWT, async (req, res) => {
	try {
		const email = req.decoded.email;
		const pen = await pending.find({ email: email }).toArray();
		const ful = await fulfilled.find({ email: email }).toArray();
		const rej = await rejected.find({ email: email }).toArray();
		const result = [...pen, ...ful, ...rej];
		res.status(201).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.get("/:orderIs", verifyJWT, async (req, res) => {
	try {
		const { orderIs } = req.params;
		const email = req.decoded.email;

		if (orderIs === "ship") {
			const result = await pending
				.find({
					$and: [{ email: email }, { status: "pending" }],
				})
				.toArray();
			return res.status(201).send(result);
		} else if (orderIs === "receive") {
			const result = await pending
				.find({
					$and: [{ email: email }, { status: "on-way" }],
				})
				.toArray();
			return res.status(201).send(result);
		} else if (orderIs === "review") {
			const result = await fulfilled
				.find({
					$and: [{ email: email }, { status: "delivered" }],
				})
				.toArray();
			return res.status(201).send(result);
		} else {
			res.status(500).send({ access: false });
		}
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.post("/create-order", verifyJWT, async (req, res) => {
	try {
		const order = req.body;

		const priceAdd = async () => {
			const newOrderData = await Promise.all(
				order?.order?.map(async o => {
					const findPrice = await products.findOne({
						product_Id: o.product_Id,
					});
					return { ...o, price: findPrice.price, productDetails: findPrice };
				}),
			);

			const no = await control.findOneAndUpdate(
				{},
				{ $inc: { orderNo: 1 } },
				{ upsert: true },
			);
			console.log(no, "no");

			const result = await pending.insertOne({
				...order,
				order: newOrderData,
				orderNo: no?.value?.orderNo + 1,
				delivery_fee: order?.shippingAddress?.district === "Dhaka" ? 60 : 120,
			});

			return res.status(201).send(result);
		};
		priceAdd();
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

module.exports = router;
