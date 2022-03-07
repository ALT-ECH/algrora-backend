const Joi = require("joi");
const firebase = require("firebase");

exports.addUser = async (_, args) => {
	const schema = Joi.object({
		username: Joi.string().alphanum().min(3).max(30).required(),
		emailAddress: Joi.string().email({
			minDomainSegments: 2,
			tlds: { allow: ["com", "net"] },
		}),
		password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),
	});
	const { error, value } = schema.validate(args);
	if (error) return { status: "FAILED", message: error.details[0] };

	const result = await firebase
		.auth()
		.createUserWithEmailAndPassword(args.emailAddress, args.password);
};
