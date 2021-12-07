const { gql } = require("apollo-server-express");

const typeDefs = gql`
	type User {
		id: ID!
		imageUri: String
		username: String!
		emailAddress: String!
		# password: String!
		cart: [Product]!
		store: Store
	}
	type Cart {
		product: Product!
		quantity: Int!
		extraData: [KeyValue]!
	}
	type Product {
		id: ID!
		imageUri: String
		name: String!
		description: String!
		price: Int!
		tag: [String]!
		extraData: [KeyValue]!
		store: Store!
	}
	type KeyValue {
		key: String
		values: [String]!
	}
	type Store {
		id: ID!
		name: String!
		imageUri: String
		description: String!
		products: [Product]!
	}
	type order {
		id: String!
		user: User!
		product: Product!
		store: Store!
		addTime: String!
	}
	# order reply to be made
	type Query {
		hello: String
		getProducts: [Product]
	}
`;

module.exports = typeDefs;
