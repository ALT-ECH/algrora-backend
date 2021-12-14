const getTime = () => {
	const now = new Date(Date.now());
	const date = `${now.getFullYear()}-${
		now.getUTCMonth() + 1
	}-${now.getUTCDate()}T${now.getUTCHours()}:${now.getUTCMinutes()}:${now.getUTCSeconds()}Z`;
	return date;
};

module.exports.getTime = getTime;
