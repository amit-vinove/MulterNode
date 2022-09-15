const mongoose = require('mongoose');
// mongoose.connect('mongodb://localhost:27017/users', {  useNewUrlParser: "true",
// useUnifiedTopology: "true"});
var conn =mongoose.Collection;

var userSchema =new mongoose.Schema({
	username: String,
	password: String,
});

var userModel = mongoose.model('Users', userSchema);
module.exports=userModel;