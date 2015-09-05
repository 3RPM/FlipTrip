var config = require('./config.json');
var accountSid = config["TWILIO_SID"];
var authToken = config["TWILIO_TOKEN"];

var client = require('twilio')(accountSid, authToken);
 
client.messages.create({
    body: "Jenny please?! I love you <3",
    to: "2027657424",
    from: "+16467594338",
	}, function(err, message) {
		if(err){
			console.log(err)
		}
		else{
	    	console.log(message)
		}
});