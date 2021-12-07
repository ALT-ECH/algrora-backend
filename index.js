const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");

const typeDefs = require("./typeDefs");
const resolvers = require("./resolvers");

const main = async () => {
	const app = express();
	app.use(cors({ origin: "*" }));

	mongoose.connect("mongodb://localhost:27017/algroraDB", {
		useNewUrlParser: true,
	});
	// mongoose.connection.on(() => console.log("connected to database"));

	const apolloServer = new ApolloServer({
		typeDefs,
		resolvers,
	});

	await apolloServer.start();

	apolloServer.applyMiddleware({ app });
	app.listen(5000, () => console.log("listening on port 5000"));
};

main();
