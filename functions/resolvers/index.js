const userResolver = require("./userResolvers");

const resolvers = {
	Query: {
		hello: () => "hello its lekan with another beffy backend implementation",
	},
	Mutation: {
		addUser: userResolver.addUser,
	},
};

module.exports = resolvers;
