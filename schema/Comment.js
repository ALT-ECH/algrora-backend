const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const commentSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: "user",
		required: [true, "user is required"],
	},
	comment: {
		type: String,
		minLength: [10, "comments must be more than 10 characters"],
		maxLength: [400, "comments must not be longer than 400 characters"],
		required: [true, "commment is required"],
	},
	uploadTime: {
		type: String,
		required: [true, "upload time is required"],
	},
	likes: {
		type: Number,
		default: 0,
	},
	disLikes: {
		type: Number,
		default: 0,
	},
});

const Comment = mongoose.model("comment", commentSchema);

module.exports = Comment;
