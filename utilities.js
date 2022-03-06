const getTime = () => {
	const now = new Date().toUTCString();
	return now;
};

module.exports.getTime = getTime;
