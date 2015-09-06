# FlipTrip
##### Uber for Dumb Phones

This provides a way for those without smartphones to request Uber rides. It provides a SMS interface that can be accessed from any text-messaging capable device. Made at PennAppsXII. 

![screen shot](https://raw.githubusercontent.com/3RPM/FlipTrip/master/screen_shot.png)

## Installation

* Clone the repo and run `npm install`
* Copy `config.sample.json` to `config.json` and input the appropriate values
	* For the Uber API, you will have to request permission to use the `request` endpoint in order to order Ubers
* In your Twilio control panel, configure a webhook to point a POST request to `http://your.url/twilio_webhook`
* Run `node app.js` to start your server

## Usage

* Navigate to `http://your.url/verify`, and grant Uber permission
* Text the number you configured `hmu` or `send me an uber`
* Text in your location
* Text in your destination
* Await your Uber!
* Text `jk` to cancel your Uber
* Text `?` for help


## WARNING

This is in beta. Use at your own risk.


## Todo

* Clean code
* Give updates via text about driver's location