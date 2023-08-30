const express = require("express");
const app = express();
const router = express.Router();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

// const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@cluster0.beqkzcx.mongodb.net/?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@cluster0.cyu4av7.mongodb.net`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

app.use(bodyParser.json());

const database = client.db("sansi");

const auth = database.collection("auth");
const users = database.collection("users");

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

router.put("/login", async (req, res) => {
	try {
		const data = req.body;
		const user = await auth.findOne({ email: data.email });
		const details = await users.findOne({ email: data?.email });

		if (user?.email === "sansi@gmail.com") {

			bcrypt.compare(data.password, user.password, (err, result) => {
				if (err) {
					console.error("Error comparing passwords:", err.message);
					return;
				}
				if (result === true) {
					jwt.sign(user, secretKey, { expiresIn: "1h" }, (err, token) => {
						if (err) {
							console.error("Error creating JWT token:", err.message);
							res.status(500).json({ error: "Internal Server Error" });
						} else {
							return res.status(201).send({ token, user: details });
						}
					});
					console.log("Password matched. User authenticated!");
				} else {
					res
						.status(500)
						.json({ message: "Password did not match. Access denied." });
				}
			});
		} else {
			res
				.status(500)
				.json({ message: "Please enter valid admin dashboard email" });
		}
	} catch (err) {
		return res.status(500).send({ message: err.message });
	}
});

router.post("/api/register", async (req, res) => {
	try {
		const user = req.body;
		const find = await auth.findOne({ email: user?.email });
		if (!find) {
			const hashedPass = await bcrypt.hash(user.password, 8);

			const createUser = await auth.insertOne({
				email: user?.email,
				password: hashedPass,
				createdAt: user?.createdAt,
			});
			const userResult = await users.insertOne({
				name: user?.name,
				email: user?.email,
				phone: user?.phone,
				createdAt: user?.createdAt,
			});
			res.status(201).send({
				data: createUser,
				message: {
					message: `User has been registered`,
					status: "success",
				},
			});
		} else {
			return res.status(201).send({
				message: { message: "Email already exists", status: "warning" },
			});
		}
	} catch (err) {
		return res.status(500).send({
			message: { message: "Server field", status: "warning" },
		});
	}
});

router.put("/api/login", async (req, res) => {
	try {
		const data = req.body;
		const user = await auth.findOne({ email: data.email });
		const details = await users.findOne({ email: data?.email });
		if (user) {
			bcrypt.compare(data.password, user.password, (err, result) => {
				if (err) {
					console.error("Error comparing passwords:", err.message);
					return;
				}
				if (result === true) {
					jwt.sign(
						{ email: user?.email },
						secretKey,
						{ expiresIn: "1h" },
						(err, token) => {
							if (err) {
								console.error("Error creating JWT token:", err.message);
								res.status(500).json({ error: "Internal Server Error" });
							} else {
								return res.status(201).send({ token, user: details });
							}
						},
					);
					console.log("Password matched. User authenticated!");
				} else {
					console.log("Password did not match. Access denied.");
					return res.status(201).send({
						message: "Password or Email did not match. Access denied.",
					});
				}
			});
		}
	} catch (err) {
		return res.status(500).send({ message: err.message });
	}
});

router.get("/getUsers", verifyJWT, async (req, res) => {
	try {
		const decoded = req.decoded;
		const result = await users.findOne({ email: decoded.email });
		res.status(201).send(result);
	} catch (err) {
		return res.status(500).send({ message: err.message });
	}
});

module.exports = router;
