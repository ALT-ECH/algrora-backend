const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { s3Sign } = require("./s3");

const Product = require("./schema/Product");
const User = require("./schema/User");
const Store = require("./schema/Store");
const Category = require("./schema/Category");
const Comment = require("./schema/Comment");

const { getTime } = require("./utilities");
const Order = require("./schema/Order");

const resolvers = {
	Product: {
		store: async (parent) => {
			return await Store.findById(parent.store);
		},
		comments: async (parent) => {
			const product = await parent.populate("comments");
			return product.comments;
		},
	},
	Store: {
		products: async (parent) => {
			const store = await parent.populate("products");
			// console.log(product);
			return store.products;
		},
	},
	Comment: {
		user: async (parent) => {
			const { user } = await parent.populate("user");
			return user;
		},
	},
	Order: {
		user: async (parent) => {
			const { user } = await parent.populate("user");
			return user;
		},
		product: async (parent) => {
			const { product } = await parent.populate("product");
			return product;
		},
		store: async (parent) => {
			const { store } = await parent.populate("store");
			return store;
		},
	},
	Query: {
		hello: () => "graphql connected",
		getProducts: async () => {
			console.log("getting products");
			return await Product.find({});
		},
		getProduct: async (_, { id }) => {
			return await Product.findById(id);
		},
		user: async (_, __, { userData }) => {
			console.log("getting user");
			return await User.findById(userData.id);
		},
		getStore: async (_, { id }) => {
			// dosen't function properly
			console.log("getting store");
			const storeData = await Store.findById(id);
			if (!storeData)
				return {
					status: "failed",
					message: "store not avaliable",
				};
			return {
				status: "success",
				store: storeData,
			};
		},
		getCategories: async () => {
			return await Category.find({});
		},
		getOrders: async (_, { type }, { userData }) => {
			if (type == "USER") return await Order.find({ userId: userData.id });
			return await Order.find({ storeId: userData.storeId });
		},
	},
	Mutation: {
		addUser: async (_, args, { secret }) => {
			console.log("adding user");
			const password = await bcrypt.hash(args.password, 12);
			const user = new User({
				username: args.username,
				password: password,
				emailAddress: args.emailAddress,
			});
			try {
				const userData = await user.save();
				const token = jwt.sign(
					{
						id: userData.id,
						username: userData.username,
						storeId: userData.store,
					},
					secret
				);
				return {
					status: "success",
					message: `${token}`,
					user: userData,
				};
			} catch (err) {
				if (err.code == 11000)
					return {
						status: "failed",
						message: "user already exists",
					};
				const base = err.errors;
				const keys = Object.keys(base);
				const message = base[keys[0]].properties.message;
				return {
					status: "failed",
					message: `${keys[0]} ${message}`,
				};
			}
		},
		login: async (parent, args, { secret }) => {
			console.log("logging in user");
			try {
				const user = await User.findOne({ username: args.username });
				console.log("testing going on here");
				if (!user)
					return {
						status: "failed",
						message: "invalid username or password",
					};
				const isValid = await bcrypt.compare(args.password, user.password);
				if (!isValid)
					return {
						status: "failed",
						message: "incorrect username or password",
					};

				const token = jwt.sign(
					{ id: user.id, username: user.username, storeId: user.store },
					secret
				);
				return {
					status: "success",
					message: `${token}`,
					user,
				};
			} catch (err) {
				console.log(err);
			}
		},
		signS3: (parent, { filename, fileType }) => {
			const uploadUrl = s3Sign(filename, fileType);
			return uploadUrl;
		},
		addStore: async (_, args, { userData }) => {
			const { name, imageUri, description } = args;
			const user = await User.findById(userData.id);
			if (user.store)
				return { status: "failed", message: "user already has a store" };
			const store = new Store({
				name,
				imageUri,
				description,
			});
			try {
				const storeData = await store.save();
				user.store = storeData._id;
				await user.save();
				return {
					status: "success",
					message: `${storeData._id}`,
					store: storeData,
				};
			} catch (err) {
				const base = err.errors;
				const keys = Object.keys(base);
				const message = base[keys[0]].properties.message;
				return {
					status: "failed",
					message: `${keys[0]} ${message}`,
				};
			}
		},
		addProduct: async (_, args, { userData }) => {
			console.log("adding Product");
			const { imageUri, name, description, price, tags } = args.product;
			const product = new Product({
				name,
				imageUri,
				description,
				price,
				tags,
			});
			try {
				const user = await User.findById(userData.id);
				const store = await Store.findById(user.store);
				product.store = store.id;
				const productData = await product.save();
				// get users store
				store.products.push(productData.id);
				await store.save();
				return {
					status: "success",
					message: "product successfully added",
					product: productData,
				};
			} catch (err) {
				const base = err.errors;
				const keys = Object.keys(base);
				const message = base[keys[0]].properties.message;
				return {
					status: "failed",
					message: `${keys[0]} ${message}`,
				};
			}
		},
		addComment: async (_, { id, comment }, { userData }) => {
			const user = await User.findById(userData.id);
			const commentData = new Comment({
				user: user._id,
				uploadTime: getTime(),
				comment,
			});
			try {
				const returnData = await commentData.save();
				const product = await Product.findById(id);
				product.comments.push(returnData.id);
				await product.save();
				return {
					status: "success",
					message: "successfully added comment",
					comment: returnData,
				};
			} catch (err) {
				const base = err.errors;
				const keys = Object.keys(base);
				const message = base[keys[0]].properties.message;
				return {
					status: "failed",
					message: `${keys[0]} ${message}`,
				};
			}
		},
		placeOrder: async (_, { orders }, { userData }) => {
			const user = await User.findById(userData.id);
			if (!user) return { status: "failed" };
			const orderList = [];
			for (item of orders) {
				const { productId, storeId, quantity } = item;
				const product = await Product.findById(productId);
				const store = await Store.findById(storeId);

				const newOrder = new Order({
					user: user._id,
					product: product._id,
					store: store._id,
					quantity,
					uploadTime: getTime(),
					updatedTime: getTime(),
				});

				orderList.push(newOrder);
			}
			try {
				Order.insertMany(orderList, (err) => {
					// better error handling here
					if (err) return { status: "failed", message: err };
					return "successful";
				});
				return { status: "success" };
			} catch (err) {
				const base = err.errors;
				const keys = Object.keys(base);
				const message = base[keys[0]].properties.message;
				return {
					status: "failed",
					message: `${keys[0]} ${message}`,
				};
			}
		},
		updateOrder: async (_, { orderId, order }, { userData }) => {
			let orderData = await Order.findById(orderId);
			for (key in order) {
				// type - "STORE", "USER" = functionality is not implemented yet
				if (order[key]) orderData[key] = order[key];
			}
			try {
				await orderData.save();
				return { status: "success", orders: [orderData] };
			} catch (err) {
				const base = err.errors;
				const keys = Object.keys(base);
				const message = base[keys[0]].properties.message;
				return {
					status: "failed",
					message: `${keys[0]} ${message}`,
				};
			}
		},
	},
};

module.exports = resolvers;
