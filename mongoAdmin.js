// const mongoose = require("mongoose");
// const Category = require("./schema/Category");

// mongoose.connect("mongodb://localhost:27017/algroraDB", {
// 	useNewUrlParser: true,
// });

// const cosmetics = new Category({
// 	name: "cosmetics",
// 	description: "body and skincare products",
// });
// const gadgets = new Category({
// 	name: "gadgets",
// 	description: "electroncis and there peripherials",
// });
// const clothing = new Category({
// 	name: "clothing",
// 	description: "any form of clothing or clothing accessories",
// });
// const sportingGoods = new Category({
// 	name: "sporting goods",
// 	description: "any equipment relating to sporting activities",
// });
// const others = new Category({
// 	name: "others",
// 	description: "anything that dosen't fit into the predefined categories",
// });

// Category.insertMany(
// 	[cosmetics, gadgets, clothing, sportingGoods, others],
// 	(err) => {
// 		if (err) return err;
// 		return "successful";
// 	}
// );
