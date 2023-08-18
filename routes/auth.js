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

const auth = client.db("auth").collection("users");
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
		const data = { email: "sansi@gmail.com", password: "sansi" };
		const user = await auth.findOne({ email: data.email });

		if (user) {
			bcrypt.compare(data.password, user.password, (err, result) => {
				if (err) {
					console.error("Error comparing passwords:", err.message);
					return;
				}
				if (result === true) {
					jwt.sign(user, secretKey, { expiresIn: "1m" }, (err, token) => {
						if (err) {
							console.error("Error creating JWT token:", err.message);
							res.status(500).json({ error: "Internal Server Error" });
						} else {
							return res.status(201).send({ token });
						}
					});
					console.log("Password matched. User authenticated!");
				} else {
					console.log("Password did not match. Access denied.");
				}
			});
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
			const registerUser = {
				...user,
				password: hashedPass,
			};
			const createUser = await auth.insertOne(registerUser);
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
		const { password, ...details } = user;

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
						{ expiresIn: "10m" },
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
					return res
						.status(201)
						.send({ message: "Password did not match. Access denied." });
				}
			});
		}
	} catch (err) {
		return res.status(500).send({ message: err.message });
	}
});

router.patch("/api/identify", verifyJWT, async (req, res) => {
	try {
		const decoded = req.decoded;
		res.status(201).send({ access: true, email: decoded?.email });
	} catch (err) {
		return res.status(500).send({ message: err.message });
	}
});

module.exports = router;
