var config = require('./config.json');
var accountSid = config["TWILIO_SID"];
var authToken = config["TWILIO_TOKEN"];
var client = require('twilio')(accountSid, authToken);

var bodyParser = require("body-parser");
var express = require('express');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

var User = require("./User")
var users = {} 
// { '+12027657424': 
//    { number: '+12027657424',
//      pickupAddress: '7609 Leonard Dr',
//      dropoffAddress: ' 22043 Braddock Rd' } }

var startPhrases = ["Send me an Uber", "hmu"]
 
function sendMessage(toNum, bodyText){ 
	client.messages.create({
	    body: bodyText,
	    to: toNum,
	    from: "+16467594338",
		}, function(err, message) {
			if(err){
				console.log(err)
			}
			else{
		    	// console.log(message)
			}
	});
}

app.post("/", function(req, res){
	var f = req.body.From
	var b = req.body.Body

	console.log(f, "said:")
	console.log(b)
	
	if(startPhrases.indexOf(b) > -1){
		users[f] = new User(f);
		sendMessage(f, "To get started, send us the address of where you are now!")
		end()
	}
	else if(users[f] && !users[f].pickupAddress){
		if(validAddress(b)){
			users[f].pickupAddress = b
			sendMessage(f, "Perfect, now hit us up with the address of where you want to go")
			end()
		}
		else{
			sendMessage(f, "Sorry, we didn't get that. Can you check the address and send it again?")
			end()
		}
	}
	else if(users[f] && !users[f].dropoffAddress){
		if(validAddress(b)){
			users[f].dropoffAddress = b
			sendMessage(f, "Perfect, now hit us up with the address of where you want to go")
			end()
		}
		else{
			sendMessage(f, "Sorry, we didn't get that. Can you check the address and send it again?")
			end()
		}
	}
	else{
		sendMessage("To request an uber, tell us 'Send me an Uber' or 'hmu'")
		end()
	}
	

	function end(){
		res.status(200);
		res.end("Aight");
	}

})


function validAddress(s){
	//TODO
	return true;
}



function sendUber(user){
	console.log(user);
	//user.number
	//user.pickupAddress
	//user.dropoffAddress

	//TODO

	sendMessage(f, "Thanks, we're sending you an uber now!")
}

app.get("/", function(req, res){
	console.log(users);
	res.end(JSON.stringify(users, null, 2));
})

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});