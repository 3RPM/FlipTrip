var User = function(number){
	this.number = number;
}

User.prototype.ready = function(){
	return (this.pickupAddress && this.dropoffAddress);
}

module.exports = User