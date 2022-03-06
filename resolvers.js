const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { s3Sign, s3Delete } = require("./s3");

const Product = require("./schema/Product");
const User = require("./schema/User");
const Store = require("./schema/Store");
const Category = require("./schema/Category");
const Comment = require("./schema/Comment");
const Order = require("./schema/Order");

const { getTime } = require("./utilities");

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
			if (!product) return {};
			return product;
		},
		store: async (parent) => {
			const { store } = await parent.populate("store");
			return store;
		},
	},
	Query: {
		hello: () => "graphql connected",
		search: async (_, { search }) => {
			const escapeRegex = (text) => {
				return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
			};
			const regex = new RegExp(escapeRegex(search), "gi");
			const results = Product.find({ name: regex });
			return results;
		},
		getProducts: async () => {
			// console.log("getting products");
			return await Product.find({});
		},
		getProduct: async (_, { id }) => {
			return await Product.findById(id);
		},
		user: async (_, __, { userData }) => {
			// console.log("getting user");
			return await User.findById(userData.id);
		},
		getStore: async (_, { id }) => {
			// dosen't function properly
			// console.log("getting store");
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
			// console.log("type", type);
			if (type == "USER") return await Order.find({ user: userData.id });
			return await Order.find({ store: userData.storeId });
		},
	},
	Mutation: {
		addUser: async (_, args, { secret }) => {
			// console.log("adding user");
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
				// console.log("testing going on here");
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
				// console.log(err);
			}
		},
		signS3: async (parent, { filename, fileType }) => {
			const uploadUrl = await s3Sign(filename, fileType);
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
		updateStore: async (_, { id, store }, { userData }) => {
			// console.log("updating store");
			const user = User.findById(userData.id);
			if (!user) return { status: "failed" };
			const storeData = await Store.findById(id);
			if (store.imageUri) {
				const imageUri = storeData.imageUri;
				const imageUriList = imageUri.split("/");
				const filename = `${imageUriList.at(-2)}/${imageUriList.at(-1)}`;
				await s3Delete(filename);
			}
			for (p in store) {
				if (store[p]) {
					storeData[p] = store[p];
				}
			}
			try {
				await storeData.save();
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
		addProduct: async (_, args, { userData }) => {
			// console.log("adding Product");
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
		updateProduct: async (_, { id, product }, { userData }) => {
			// console.log("updating product");
			const user = User.findById(userData.id);
			if (!user) return { status: "failed" };
			const productData = await Product.findById(id);
			if (product.imageUri) {
				const imageUri = productData.imageUri;
				const imageUriList = imageUri.split("/");
				const filename = `${imageUriList.at(-2)}/${imageUriList.at(-1)}`;
				await s3Delete(filename);
			}
			for (p in product) {
				if (product[p]) {
					productData[p] = product[p];
				}
			}
			try {
				await productData.save();
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
		deleteProduct: async (_, { id }, { userData }) => {
			const user = await User.findById(userData.id);
			if (!user) return { status: "failed", message: "unauthorized" };

			const product = await Product.findById(id);
			if (!product)
				return { status: "failed", message: "product doesn't exist" };
			const imageUri = product.imageUri;
			const imageUriList = imageUri.split("/");
			const filename = `${imageUriList.at(-2)}/${imageUriList.at(-1)}`;
			await s3Delete(filename);
			const store = await Store.findById(product.store);
			// console.log("product _id", product.id);
			// clean up store
			const products = [];
			for (p of store.products) {
				const pData = await Product.findOne({ _id: p });
				if (pData.id !== product.id) products.push(pData._id);
			}
			store.products = products;
			// clean up comments
			for (comment of product.comments) {
				Comment.findOneAndDelete({ _id: comment });
			}
			try {
				await store.save();
				// clean up orders
				await Order.deleteMany({ product: product._id });
				await Product.findByIdAndDelete(product.id);
				return { status: "success" };
			} catch (err) {
				return { status: "failed", message: err };
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
			// console.log("placing order");
			const preOrdersList = await Order.find({});
			// console.log(preOrdersList);
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
					lastActive: "USER",
					read: false,
				});

				orderList.push(newOrder);
			}
			try {
				await Order.insertMany(orderList);
				// console.log("here");
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
		updateOrder: async (_, { orderId, order, type }, { userData }) => {
			const user = await User.findById(userData.id);
			if (!user) return { status: "failed", message: "unauthorized user" };
			let orderData = await Order.findById(orderId);
			for (key in order) {
				// type - "STORE", "USER" = functionality is not implemented yet
				orderData.read = false;
				if (type == "USER") {
					orderData.lastActive = "USER";
				} else {
					orderData.lastActive = "STORE";
				}
				orderData.updatedTime = getTime();
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
		cancelOrder: async (_, { id }, { userData }) => {
			const user = await User.findById(userData.id);
			if (!user) return { status: "failed", message: "unauthorized user" };
			const order = await Order.findById(id);
			if (!order) return { status: "failed", message: "invalid order" };
			order.status = "CANCEL";
			// console.log("here", order);
			try {
				await order.save();
				return { status: "success", orders: [order] };
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
		markRead: async (_, { type, ids }, { userData }) => {
			const user = await User.findById(userData.id);
			if (!user) return { status: "failed", message: "unauthorized uers" };
			let errorMessage = "";
			for (const id of ids) {
				const order = await Order.findById(id);
				if (order.lastActive !== type) {
					order.read = true;
				}
				await order.save();
				try {
					await order.save();
				} catch (err) {
					const base = err.errors;
					const keys = Object.keys(base);
					const message = base[keys[0]].properties.message;
					errorMessage += message; // don't actually know if it works
				}
			}
			if (errorMessage) return { status: "failed", message: errorMessage };
			return { status: "success" };
		},
	},
};

module.exports = resolvers;
