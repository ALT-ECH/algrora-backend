const mongoose = require("mongoose");

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
		required: [true, "store field is required"],
	},
	description: {
		type: String,
		required: [true, "description is required. must be > 20 and < 2000"],
		minLength: 20,
		maxLength: 2000,
	},
	price: {
		type: Number,
		required: [true, "price is required"],
	},
	tag: {
		type: [String],
		validate: {
			validator: (v) => Array.isArray(v) && v.length > 0,
			message: (props) => `${props.value} must contain atleast one tag`,
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
});

const Product = mongoose.model("product", productSchema);

module.exports = Product;
