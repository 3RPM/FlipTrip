var config = require('./config.json');
var accountSid = config["TWILIO_SID"];
var authToken = config["TWILIO_TOKEN"];
var client = require('twilio')(accountSid, authToken);

var bodyParser = require("body-parser");

var express = require('express');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
 
function respond(toNum, bodyText){ 
	client.messages.create({
	    body: bodyText,
	    to: toNum,
	    from: "+16467594338",
		}, function(err, message) {
			if(err){
				console.log(err)
			}
			else{
		    	console.log(message)
			}
	});
}

app.post("/", function(req, res){
	console.log(req.body.From, "said:")
	console.log(req.body.Body)
	var f = req.body.From
	var b = req.body.Body
	respond(f, "Wasssupp")
	res.status(200);
	res.end("Aight");

})

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});