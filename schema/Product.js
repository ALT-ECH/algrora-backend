const mongoose = require("mongoose");
const Category = require("./Category");

const Schema = mongoose.Schema;

const productSchema = new Schema({
	imageUri: String,
	name: {
		type: String,
		index: true,
		unique: true,
		required: [true, "name is required"],
	},
	store: {
		type: Schema.Types.ObjectId,
		ref: "store",
		required: [true, "store is required"],
	},
	description: {
		type: String,
		required: [true, "description is required"],
		minLength: [20, "description must be long than 20 characters"],
		maxLength: [2000, "description must not be more than 2000 characters"],
	},
	price: {
		type: Number,
		required: [true, "price is required"],
	},
	tags: {
		type: [String],
		validate: {
			validator: async (v) => {
				if (!Array.isArray(v)) return false;
				if (!v.length) return false;
				for (let value of v) {
					const category = await Category.find({ name: value });
					if (!category) return false;
				}
				return true;
			},
			message: (props) => `${props.value} is invalid`,
		},
	},
	extraData: [
		{
			key: { type: String, required: [true, "key is required"] },
			values: {
				type: [String],
				validate: {
					validator: (v) => Array.isArray(v) && v.length > 0,
					message: (props) => `${props.value} must be a string and is required`,
				},
			},
		},
	],
	comments: [
		{
			type: Schema.Types.ObjectId,
			ref: "comment",
		},
	],
});

const Product = mongoose.model("product", productSchema);

module.exports = Product;
