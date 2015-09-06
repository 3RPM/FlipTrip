var config = require('./config.json');

var Uber = require('node-uber');

var accountSid = config["TWILIO_SID"];
var authToken = config["TWILIO_TOKEN"];
var number = config["TWILIO_NUMBER"]

var googleApiKey = config["GOOGLE_API_KEY"]

var uberClientId = config["UBER_CLIENT_ID"]
var uberClientSecret = config["UBER_CLIENT_SECRET"]
var uberServerToken = config["UBER_SERVER_TOKEN"]

var querystring = require('querystring');
var request = require('request');

var client = require('twilio')(accountSid, authToken);

var User = require("./User")


var phillyUberXId = "1a150e95-d687-454b-9878-2942a9448693"

var expressPort = config["PORT"];

var bodyParser = require("body-parser");
var express = require('express');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));


var uberClient = new Uber({
	client_id: uberClientId,
	client_secret: uberClientSecret,
	server_token: uberServerToken,
	redirect_uri: 'http://localhost:' + expressPort + '/auth',
	name: 'Stoober'
});

var users = {} 

var unclaimedEmails = [];

var emailAccessMap = {}
// { '+12027657424': 
//	{ number: '+12027657424',
//		pickupAddress: '7609 Leonard Dr',
//		dropoffAddress: ' 22043 Braddock Rd' } }

var startPhrases = ["send me an uber", "hmu"]
var endPhrases = ["stop", "cancel"]

var geocoderHttpAdapter = 'https';

var extra = {
    apiKey: googleApiKey
};

var geocoder = require('node-geocoder')('google', geocoderHttpAdapter, extra)



console.log(geocoder.geocode)

var emailPhoneMap = {}
 
function sendMessage(toNum, bodyText){ 

	console.log("Sending to", toNum, ":", bodyText)

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

app.post("/twilio_webhook", function(req, res){
	var f = req.body.From
	var b = req.body.Body

	console.log(f, "said:")
	console.log(b)
	if(!f || !b)
		return end()

	if(b.toLowerCase().indexOf("claim") == 0 && !users[f]){
		var email = b.toLowerCase().substring("claim".length).trim()
		if(unclaimedEmails.indexOf(email) == -1)
			sendMessage(f, "Authenticate yourself first!")
		else{
			users[f] = new User(f, email);
			users[f].accessToken = emailAccessMap[email] + ""
			unclaimedEmails.splice(unclaimedEmails.indexOf(email), 1)

			sendMessage(f, "Successfully verified!")
			console.log(users[f])
		}

		end()
		
	}
	else if(users[f]){

		console.log(b.toLowerCase())
		console.log(startPhrases.indexOf(b.toLowerCase()))

		if(startPhrases.indexOf(b.toLowerCase()) > -1){
			sendMessage(f, "To get started, send us the address of where you are now!")

			users[f].reset()
			end()
		}
		else if(users[f] && users[f].pickupCoords.lat === null){
			addressToLatLon(b, function(latLon){
				console.log(latLon)
				if(latLon){
					users[f].pickupCoords = latLon
					var m = "Perfect, you're at "+latLon.lat+", "+latLon.lon+". Now send us the address of where you want to go"
					sendMessage(f, m)
				}
				else{
					sendMessage(f, "Sorry, we didn't get that. Can you check the address and send it again?")
				}
				end()
			})
		}
		else if(users[f] && users[f].dropoffCoords.lat === null){
			addressToLatLon(b, function(latLon){
				if(latLon){
					users[f].dropoffCoords = latLon
					var m = "Perfect, you're at "+latLon.lat+", "+latLon.lon+". We'll send you an Uber and let you know when its on its way"

					sendMessage(f, m)
					sendUber(users[f], function(){
						//...
						end()
					})
				}
				else{
					sendMessage(f, "Sorry, we didn't get that. Can you check the address and send it again?")
					end()
				}
			})
		}
		else if(endPhrases.indexOf(b.toLowerCase()) > -1){
			if(!users[f].requestId)
				return end()

			killUber(users[f], function(){
				end()
			})
			//end request with uber API
			
		}
		else{
			sendMessage(f, "To request an uber, tell us 'Send me an Uber' or 'hmu'")
			end()
		}

	}
	
	

	function end(){
		res.status(200);
		res.end("Aight");
	}

})

//create webhook to clear location/destination afterwards

function addressToLatLon(s, callback){
	console.log("started geocoding")
	console.log(s)

	geocoder.geocode(s, function(err, res) {
		// console.log(err, res)
		if(err){
			console.log(err)
			callback(false)
		}
		else{
			if(res.length > 0){
				r = res[0]
				// console.log(r)
				obj = {lat: r.latitude, lon:r.longitude}
				// console.log(r.latitude)
				// console.log(r.longitude)
				console.log(obj)
				callback(obj)
			}
			else{
				console.log(res)
				callback(false)
			}
		}
	});
}


function sendUber(user, callback, surgeId){
	console.log(user);
	console.log("About to send Uber")

	if(surgeId){
		console.log("ACCEPTING SURGE PRICING!!!!!")
	}

	var requestForm = {
		"product_id": phillyUberXId,
		"start_latitude": user.pickupCoords.lat,
		"start_longitude": user.pickupCoords.lon,
		"end_latitude": user.dropoffCoords.lat,
		"end_longitude": user.dropoffCoords.lon,
	};

	if(surgeId){
		requestForm["surge_confirmation_id"] = surgeId
	}


	console.log("SendUber")
	console.log(user)

	request({
		headers: {
			'Authorization': 'Bearer ' + user.accessToken
		},
		uri: "https://api.uber.com/v1/requests",
		// uri: "https://sandbox-api.uber.com/v1/sandbox/requests",
		body: requestForm,
		json: true,
		method: "POST"
		}, function (err, res, body) {

			console.log("GOT RESPONSE")
			console.log("BODY")
			console.log(res.body)
			console.log("END BODY")
			if(err)
				console.log(err)

			console.log(typeof res.body)
			if(typeof res.body == "string")
				res.body = JSON.parse(res.body)

			if(res.body.meta && res.body.meta.surge_confirmation && res.body.meta.surge_confirmation.surge_confirmation_id)
				return sendUber(user, callback, res.body.meta.surge_confirmation.surge_confirmation_id)

			if(!err){
				users[user.number].requestId = res.body["request_id"]
				sendMessage(user.number, "Excellent! Your Uber will arrive soon - we'll text you some details before then! If you wish to cancel your ride, text 'Stop' or 'Cancel'")
			}
			else{
				console.log(err)
				sendMessage(user.number, "There was an error ordering your Uber! :(")
			}
	});

	
}

function killUber(user, callback){

	//in success of async call
	//uberAPIrequest(user, function(e, r){
		//if(!e)
			sendMessage(f, "We cancelled your Uber!")
		//else
			//sendMessage(f, "Oh no! We couldn't cancel your Uber")
	//})



	request({
		headers: {
			'Authorization': 'Bearer ' + user.accessToken
		},
		uri: "https://api.uber.com/v1/requests/" + user.requestId,
		body: formData,
		method: "DELETE"
		}, function (err, res, body) {
			if(!err){
				user.reset()
				sendMessage(user.number, "You've cancelled your Uber")
			}
			else{
				console.log(err)
				sendMessage(user.number, "There was an error cancelling your Uber! :(")
			}
	});


}

app.get("/", function(req, res){
	console.log(users);
	res.end(JSON.stringify(users, null, 2) + "\n\n\n" + JSON.stringify(emailAccessMap, null, 2));
})

var server = app.listen(expressPort, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Example app listening at http://%s:%s', host, port);
});


app.get("/verify", function(req, res){
	res.redirect("http://login.uber.com/oauth/authorize?response_type=code&client_id=" + uberClientId + "&scope=profile%20history_lite%20history%20request")
})

app.get("/auth", function(req, res){
	var authCode = req.query.code
	console.log(authCode)

	uberClient.authorization(
		{
			authorization_code: authCode
		}, 
		function (err, accessToken, refreshToken) {

			request(
			{
				headers: {
					'Authorization': 'Bearer ' + accessToken
				},
				uri: "https://api.uber.com/v1/me",
				method: "GET"
			},function (e, r, body) {
				if(e)
					console.log(e)
				console.log("---me")
				r.body = JSON.parse(r.body)
				console.log(r.body)
				console.log(typeof r.body)
				console.log(r.body.email)
				var email = r.body.email;
				if(emailPhoneMap[email])
					return end()

				if(email){
					unclaimedEmails.push(email.toLowerCase())
					emailAccessMap[email] = accessToken	
				}
				
				console.log(emailAccessMap)

				console.log("---/me")
				res.status(200)
				res.end("Nice work. Now, text " + number + " 'Claim your@email.com', to verify your account.")
			})



		}
	);


})

// app.get("/auth", function(req, res){
// 	var authCode = req.query.code
// 	console.log(authCode)
// 	console.log("A")


// 	var authForm = {
// 		"client_secret": uberClientSecret,
// 		"client_id": uberClientId,
// 		"grant_type": "authorization_code",
// 		"redirect_uri": "http://localhost:" + expressPort,
// 		"code": authCode
// 	};

// 	var formData = querystring.stringify(authForm);

// 	request({
// 		uri: "https://login.uber.com/oauth/token",
// 		body: formData,
// 		method: "POST"
// 		}, function (err, res, body) {
// 			console.log(res.body)

// 			var accessToken = res.body.access_token


// 			request(
// 			{
// 				headers: {
// 					'Authorization': 'Bearer ' + accessToken
// 				},
// 				uri: "https://api.uber.com/v1/me",
// 				body: formData,
// 				method: "GET"
// 			},function (err, res, body) {
// 				console.log("---me")
// 				console.log(res.body)
// 				console.log("---/me")
// 			})

// 	});


// })

// console.log(addressToLatLon("7609 Leonard Drive"))