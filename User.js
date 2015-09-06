var User = function(number, email){
	this.number = number;
	this.email = email;
	this.pickupAddress = null;
	this.dropoffAddress = null;
	this.pickupCoords = {
		lat: null,
		lon: null
	}
	this.dropoffCoords = {
		lat: null,
		lon: null
	}
	this.requestId = null;
	this.accessToken = null;
}

User.prototype.ready = function(){
	return (this.pickupAddress && this.dropoffAddress);
}

User.prototype.reset = function(){
	this.dropoffAddress = null;
	this.pickupAddress = null;
	this.pickupCoords = {
		lat: null,
		lon: null
	}
	this.dropoffCoords = {
		lat: null,
		lon: null
	}
	this.requestId = null;
	return true;
}

module.exports = User