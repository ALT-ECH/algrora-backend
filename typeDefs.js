const { gql } = require("apollo-server-express");

const typeDefs = gql`
	type User {
		id: ID!
		imageUri: String
		username: String!
		emailAddress: String!
		# password: String!
		cart: [Product]!
		store: String
	}
	type Cart {
		product: Product!
		quantity: Int!
		extraData: [KeyValue]!
	}
	# rating functionality to be resolved
	type RatingDist {
		_5: Int!
		_4: Int!
		_3: Int!
		_2: Int!
		_1: Int!
	}
	type RatingData {
		user: User!
		rating: Int!
	}
	type Rating {
		ratingDistribution: RatingDist
		ratingData: RatingData
	}
	# comment functionality
	type Comment {
		user: User!
		comment: String!
		uploadTime: String!
		likes: Int!
		disLikes: Int!
	}
	type Product {
		id: ID!
		imageUri: String
		name: String!
		description: String!
		price: Int!
		tags: [String]!
		extraData: [KeyValue]!
		store: Store!
		rating: [Rating]!
		comments: [Comment]!
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
	type Order {
		id: String!
		user: User!
		product: Product!
		store: Store!
		addTime: String!
	}
	type Category {
		name: String!
		description: String!
	}
	# order reply to be made
	type StoreMessage {
		status: String!
		message: String
		store: Store
	}
	type UserMessage {
		status: String!
		message: String
		user: User
	}
	type ProductMessage {
		status: String!
		message: String
		product: Product
	}
	type CommentMessage {
		status: String!
		message: String
		comment: Comment
	}
	input ProductInput {
		imageUri: String
		name: String!
		description: String!
		price: String!
		tags: [String!]!
	}
	type Query {
		hello: String
		getProducts: [Product]
		getProduct(id: ID): Product!
		user: User
		getStore(id: ID!): StoreMessage
		getCategories: [Category]!
	}
	type Mutation {
		addUser(
			username: String!
			emailAddress: String!
			password: String!
		): UserMessage
		login(username: String!, password: String!): UserMessage
		signS3(filename: String!, fileType: String!): String!
		addStore(
			name: String!
			imageUri: String
			description: String!
		): StoreMessage
		addProduct(product: ProductInput): ProductMessage!
		addComment(id: ID!, comment: String!): CommentMessage!
	}
`;

module.exports = typeDefs;
