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

router.get("/get/flash", verifyJWT, async (req, res) => {
	try {
		const result = await products.find({ flash: true }).toArray();
		res.status(201).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.get("/get/history", verifyJWT, async (req, res) => {
	try {
		const result = await history.find({}).toArray();
		res.status(200).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.delete("/delete/:id", verifyJWT, async (req, res) => {
	try {
		const email = req.decoded.email;
		const { id } = req.params;
		const admin = await users.findOne({ email: email });
		const result = await products.findOneAndDelete({ product_Id: id });

		await history.insertOne({
			status: "delete",
			productDetails: [result?.value],
			actionInfo: {
				admin: admin,
				actionDate: {
					date: new Date(),
					fns: {
						fns_PP,
						fns_P,
						fns_pp,
					},
				},
			},
		});

		res.status(201).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.get("/get/products/:category", verifyJWT, async (req, res) => {
	try {
		const { category: categoryName } = req.params;
		const result = await products.find({ category: categoryName }).toArray();
		res.status(201).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.put("/order/complete", verifyJWT, async (req, res) => {
	try {
		const email = req.decoded.email;
		const { id, name } = req.body;
		const complete = await pending.findOneAndDelete({ _id: new ObjectId(id) });
		const admin = await users.findOne({ email: email });
		const user = await users.findOne({ email: complete.value.email });
		if (complete) {
			const { _id, status, ...restData } = complete.value;

			const result = await fulfilled.insertOne({
				...restData,
				status: "delivered",
				user,
				completedInfo: {
					author: "admin",
					name,
					completedDate: {
						date: new Date(),
						fns: {
							fns_PP,
							fns_P,
							fns_pp,
						},
					},
				},
			});

			const historyResult = await history.insertOne({
				status: "delivered",
				productDetails: restData?.order,
				user,
				actionInfo: {
					admin: admin,
					actionDate: {
						date: new Date(),
						fns: {
							fns_PP,
							fns_P,
							fns_pp,
						},
					},
				},
			});
			console.log(historyResult, "historyResult");
			return res.status(201).send(result);
		}
		res.status(500).send({ access: false });
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.put("/order/field", verifyJWT, async (req, res) => {
	try {
		const email = req.decoded.email;
		const { id, name } = req.body;
		const cancel = await pending.findOneAndDelete({ _id: new ObjectId(id) });
		const admin = await users.findOne({ email: email });
		const user = await users.findOne({ email: cancel.value.email });
		if (cancel) {
			const { _id, status, ...restData } = cancel.value;

			const result = await rejected.insertOne({
				...restData,
				status: "field",
				user,
				fieldInfo: {
					author: "admin",
					name,
					fieldDate: {
						date: new Date(),
						fns: {
							fns_PP,
							fns_P,
							fns_pp,
						},
					},
				},
			});

			const hisResult = await history.insertOne({
				status: "field",
				productDetails: restData?.order,
				user,
				actionInfo: {
					admin: admin,
					actionDate: {
						date: new Date(),
						fns: {
							fns_PP,
							fns_P,
							fns_pp,
						},
					},
				},
			});

			console.log(hisResult, "history");

			return res.status(201).send(result);
		}
		res.status(500).send({ access: false });
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.put("/order/cancel", verifyJWT, async (req, res) => {
	try {
		const email = req.decoded.email;
		const { id, name } = req.body;
		const cancel = await pending.findOneAndDelete({ _id: new ObjectId(id) });
		const admin = await users.findOne({ email: email });
		const user = await users.findOne({ email: cancel.value.email });
		if (cancel) {
			const { _id, status, ...restData } = cancel.value;

			const result = await rejected.insertOne({
				...restData,
				status: "cancelled",
				user,
				cancelInfo: {
					author: "admin",
					name,
					rejectedDate: {
						date: new Date(),
						fns: {
							fns_PP,
							fns_P,
							fns_pp,
						},
					},
				},
			});
			{
				/* date, id, name, info, author, action */
			}

			const hisResult = await history.insertOne({
				status: "cancelled",
				productDetails: restData?.order,
				user,
				actionInfo: {
					admin: admin,
					actionDate: {
						date: new Date(),
						fns: {
							fns_PP,
							fns_P,
							fns_pp,
						},
					},
				},
			});
			console.log(hisResult, "history");
			return res.status(201).send(result);
		}
		res.status(500).send({ access: false });
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.put("/order/confirm", verifyJWT, async (req, res) => {
	try {
		const email = req.decoded.email;
		const admin = await users.findOne({ email: email });
		const body = req.body;
		const result = await pending.updateOne(
			{ _id: new ObjectId(body?.id) },
			{ $set: { shipped: body?.shipped, status: "on-way" } },
			{ upsert: true },
		);
		const find = await pending.findOne({ _id: new ObjectId(body?.id) });

		const hisResult = await history.insertOne({
			status: "on-way",
			productDetails: find?.order,
			user: find?.user,
			actionInfo: {
				admin: admin,
				actionDate: {
					date: new Date(),
					fns: {
						fns_PP,
						fns_P,
						fns_pp,
					},
				},
			},
		});
		console.log(hisResult, "history");

		res.status(201).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.get("/get/order/:status", verifyJWT, async (req, res) => {
	try {
		const { status } = req.params;
		let result = [];

		switch (status) {
			case "pending":
				const pendingOrder = await pending
					.find({ status: "pending" })
					.toArray();
				result = pendingOrder;
				break;

			case "on-way":
				const onWay = await pending.find({ status: "on-way" }).toArray();
				result = onWay;
				break;

			case "cancelled":
				// const cancel = await rejected.find({ status: "cancelled" }).toArray();
				const cancel = await rejected
					.find({
						$or: [{ status: "cancelled" }, { status: "field" }],
					})
					.toArray();
				result = cancel;
				break;

			case "delivered":
				const deliveryDone = await fulfilled
					.find({ status: "delivered" })
					.toArray();
				result = deliveryDone;
				break;

			default:
				break;
		}

		res.status(201).send({ order: result });
	} catch (err) {
		res.status(501).send({ message: err.message });
	}
});

router.get("/get/orderLength", verifyJWT, async (req, res) => {
	try {
		const pendingOrder = await pending.find({ status: "pending" }).toArray();
		const onWay = await pending.find({ status: "on-way" }).toArray();
		const cancelled = await rejected.find({ status: "cancelled" }).toArray();
		const delivered = await fulfilled.find({ status: "delivered" }).toArray();
		res.status(201).send({ pendingOrder, onWay, cancelled, delivered });
	} catch (err) {
		res.status(501).send({ message: err.message });
	}
});

router.get("/get/productsLength", verifyJWT, async (req, res) => {
	try {
		const result = await products.find({}).toArray();

		const shirt = result.filter(p => p.category === "shirt");
		const tShirt = result.filter(p => p.category === "t-shirt");
		const poloShirt = result.filter(p => p.category === "polo-shirt");
		const panjabi = result.filter(p => p.category === "panjabi");
		const pajama = result.filter(p => p.category === "pajama");

		res.status(201).send({
			shirt: shirt.length,
			tShirt: tShirt.length,
			poloShirt: poloShirt.length,
			panjabi: panjabi.length,
			pajama: pajama.length,
		});
	} catch (err) {
		res.status(501).send({ message: err.message });
	}
});

router.get("/get/product/:id", verifyJWT, async (req, res) => {
	try {
		const { id } = req.params;
		const result = await products.findOne({ product_Id: id });
		res.status(201).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.put("/product/update/:id", verifyJWT, async (req, res) => {
	try {
		const email = req.decoded.email;
		const { id } = req.params;
		const data = req.body;
		const admin = await users.findOne({ email: email });

		const result = await products.updateOne(
			{ _id: new ObjectId(id) },
			{
				$set: data,
			},
		);

		await history.insertOne({
			status: "update",
			productDetails: [data],
			actionInfo: {
				admin: admin,
				actionDate: {
					date: new Date(),
					fns: {
						fns_PP,
						fns_P,
						fns_pp,
					},
				},
			},
		});

		res.status(201).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.post("/create", verifyJWT, async (req, res) => {
	try {
		const data = req.body;
		const email = req.decoded.email;
		const result = await products.insertOne(data);
		const admin = await users.findOne({ email: email });

		await history.insertOne({
			status: "create",
			productDetails: [data],
			actionInfo: {
				admin: admin,
				actionDate: {
					date: new Date(),
					fns: {
						fns_PP,
						fns_P,
						fns_pp,
					},
				},
			},
		});

		res.status(201).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.post("/create_category", verifyJWT, async (req, res) => {
	try {
		const data = req.body;
		const result = await categoryLists.insertOne(data);
		res.status(201).send(result);
	} catch (err) {
		res.status(500).send({ message: err.message });
	}
});

router.get("/category", verifyJWT, async (req, res) => {
	try {
		const result = await categoryLists.find({}).toArray();
		res.status(201).send(result);
	} catch (err) {
		res.status(501).send({ message: err.message });
	}
});

router.delete("/category/delete", verifyJWT, async (req, res) => {
	try {
		const { id } = req.query;
		const result = await categoryLists.deleteOne({ _id: new ObjectId(id) });
		res.status(201).send(result);
	} catch (err) {
		res.status(501).send({ message: err.message });
	}
});

module.exports = router;
