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
//	{ number: '+12027657424',
//	  pickupAddress: '7609 Leonard Dr',
//	  dropoffAddress: ' 22043 Braddock Rd' } }

var startPhrases = ["Send me an Uber", "hmu"]
var endPhrases = ["stop", "cancel"]

function isStartPhrase(string){
	var cleanString = string.trim().toLowerCase()
	return startPhrases.some(function(e){
		return cleanString == e.toLowerCase()
	})
}
 
function isEndPhrase(string){
	var cleanString = string.trim().toLowerCase()
	return endPhrases.some(function(e){
		return cleanString == e.toLowerCase()
	})
}

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
	
	if(isStartPhrase(b)){
		users[f] = new User(f);
		sendMessage(f, "To get started, send us the address of where you are now!")
		end()
	}
	else if(users[f] && !users[f].pickupAddress){


		validateAddress(b, function(r){
			if(r){
				users[f].pickupAddress = b
				sendMessage(f, "Perfect, now hit us up with the address of where you want to go")
				end()
			} else {
				sendMessage(f, "Sorry, we didn't get that. Can you check the address and send it again?")
				end()
			}
		})
	}
	else if(users[f] && !users[f].dropoffAddress){

		validateAddress(b, function(r){
			if(r){
				users[f].dropoffAddress = b
				sendUber(users[f])

				end()
			} else {
				sendMessage(f, "Sorry, we didn't get that. Can you check the address and send it again?")
				end()
			}
		})

	}
	else if(isEndPhrase(b)){
		//end request with uber API
		sendMessage(f, "Your Uber ride has been cancelled!")
	}
	else{
		sendMessage("To request an uber, text 'Send me an Uber' or 'hmu'")
		end()
	}
	

	function end(){
		res.status(200);
		res.end("Aight");
	}

})


function validateAddress(s, callback){
	//TODO
	//some request to maps API
	//mapsAPIrequest(s, function(e, r){
		callback(true);
	//})
	
}



function sendUber(user, callback){
	console.log(user);
	//user.number
	//user.pickupAddress
	//user.dropoffAddress

	//TODO

	//in success of async call
	//uberAPIrequest(user, function(e, r){
		//if(!e)
			sendMessage(f, "Excellent! Your Uber will arrive soon - we'll text you some details before then! If you wish to cancel your ride, text 'Stop' or 'Cancel'")
	//})
	
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