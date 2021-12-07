const Product = require("./schema/Product");

const resolvers = {
	Query: {
		hello: () => "graphql connected",
		getProducts: async () => {
			return await Product.find({});
		},
	},
};

module.exports = resolvers;
