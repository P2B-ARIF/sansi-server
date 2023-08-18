const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const authRoute = require("./routes/auth");
app.use("/auth", authRoute);

const productRoute = require("./routes/products");
app.use("/product", productRoute);

const orderRoute = require("./routes/order");
app.use("/order", orderRoute);

app.get("/", (req, res) => {
	res.send("Hello world.");
});
app.listen(port, (req, res) => {
	console.log(`Server is running port on ${port}`);
});
