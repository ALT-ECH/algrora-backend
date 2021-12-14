const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const userSchema = new Schema({
	imageUri: String,
	username: {
		type: String,
		index: true,
		unique: true,
		required: [true, "username is required"],
		minLength: [3, "cannot be smaller than 3 characters"],
		maxLength: [15, "cannot be bigger than 15 characters"],
	},
	emailAddress: {
		type: String,
		index: true,
		unique: true,
		required: [true, "emailAddress required"],
		validate: {
			validator: (v) => {
				const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
				return re.test(v);
			},
			message: (props) => `${props.value} isn't a valid email address`,
		},
	},
	password: {
		type: String,
		required: [true, "password is required"],
	},
	cart: [
		{
			product: { type: Schema.Types.ObjectId, ref: "product", required: true },
			quantity: { type: Number, required: true },
			extraData: [
				{
					key: { type: String, required: [true, "key is required"] },
					values: {
						type: [String],
						validate: {
							validator: (v) => Array.isArray(v) && v.length > 0,
							message: (props) =>
								`${props.value} must be a string and is required`,
						},
					},
				},
			],
		},
	],
	store: {
		type: Schema.Types.ObjectId,
		ref: "store",
	},
});
const User = mongoose.model("user", userSchema);

module.exports = User;
