const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("apollo-server-express");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const typeDefs = require("./typeDefs");
const resolvers = require("./resolvers");

dotenv.config();

const secret = process.env.SECRET_KEY;

const main = async () => {
	const app = express();
	app.use(cors({ origin: "*" }));

	await mongoose.connect("mongodb://localhost:27017/algroraDB", {
		useNewUrlParser: true,
	});
	console.log("mongoose connected");

	const schema = makeExecutableSchema({
		typeDefs,
		resolvers,
	});

	const authorization = async (req) => {
		const bearer = req.headers.authorization || "";
		if (!bearer) return req.next();
		const token = bearer.split(" ")[1];
		try {
			const user = await jwt.verify(token, secret);
			req.user = user;
		} catch (err) {
			console.log(err);
		}
		req.next();
	};

	app.use(authorization);

	const apolloServer = new ApolloServer({
		schema: schema,
		context: ({ req }) => {
			return { secret, userData: req.user };
		},
	});

	await apolloServer.start();

	apolloServer.applyMiddleware({ app });
	app.listen(5000, () => console.log("listening on port 5000"));
};

main();
