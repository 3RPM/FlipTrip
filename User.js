var User = function(number, email){
	this.number = number;
	this.email = email;
}

User.prototype.ready = function(){
	return (this.pickupAddress && this.dropoffAddress);
}

module.exports = User