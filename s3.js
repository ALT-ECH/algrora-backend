const aws = require("aws-sdk");
const dotenv = require("dotenv");

dotenv.config();

const region = "us-east-2";
const bucketName = "algrora-image-storage";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_TOKEN;

const s3 = new aws.S3({
	region,
	accessKeyId,
	secretAccessKey,
	signatureVersion: "v4",
});

const s3Sign = async (filename, fileType) => {
	const params = {
		Bucket: bucketName,
		Key: filename,
		ContentType: fileType,
		Expires: 60 * 5,
	};

	const uploadURL = await s3.getSignedUrlPromise("putObject", params);
	return uploadURL;
};

const s3Delete = async (filename) => {
	const params = {
		Bucket: bucketName,
		Key: filename,
	};
	s3.deleteObject(params, (err, data) => {
		if (err) return console.log("err", err);
		console.log("data", data);
	});
};

// s3Delete("2022-01-01~shny9~photo__aacbe.jpeg");
module.exports = {
	s3Sign,
	s3Delete,
};
