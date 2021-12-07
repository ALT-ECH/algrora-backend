const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const storeSchema = new Schema({
	name: {
		type: String,
		minLength: [3, "store name can't be less than 3 characters"],
		maxLength: [16, "store name can't be more than 16 characters"],
		required: [true, "store is required"],
	},
	imageUri: String,
	description: {
		type: String,
		required: [true, "description is required. must be > 20 and < 2000"],
		minLength: 20,
		maxLength: 2000,
	},
	products: [{ type: Schema.Types.ObjectId, ref: "product" }],
});

const Store = mongoose.model("store", storeSchema);

module.exports = Store;
