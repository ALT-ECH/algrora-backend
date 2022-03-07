const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const firebase = require("firebase");

const typeDefs = require("./typeDefs");
const resolvers = require("./resolvers");

admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const app = express();
const db = admin.firestore();

const firebaseConfig = {
	apiKey: "AIzaSyCioHeIq7UQVQBok-dfpRbIFZbBl48pBs4",
	authDomain: "algrora-mini-store.firebaseapp.com",
	projectId: "algrora-mini-store",
	storageBucket: "algrora-mini-store.appspot.com",
	messagingSenderId: "391665438080",
	appId: "1:391665438080:web:3bb436009837bb6b560565",
	measurementId: "G-KPD2RM0G3C",
};

firebase.initializeApp(firebaseConfig);

const main = async () => {
	const schema = makeExecutableSchema({
		typeDefs,
		resolvers,
	});

	const apolloServer = new ApolloServer({
		schema: schema,
	});

	await apolloServer.start();

	apolloServer.applyMiddleware({ app, path: "/", cors: true });
};

exports.api = functions.https.onRequest(app);

main();
