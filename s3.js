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

module.exports.s3Sign = s3Sign;
