// CONTROLLER VARIABLES

// html elements
var outputDiv;
var controls;
var hpBar;

// sockets and online things
var socket = io();
var name = "bob";
var roomKey = "";

// gameplay utils
var waitingMsg;
var failSafe;
var itemInfo = ""; // send item info to the game

// CONTROLLER FUNCTIONS

// set up on start
function appInit() {
	// get controls table
	controls = document.getElementById("controls");
	// get hp bar
	hpBar = document.getElementById("healthBar");
	// sound
	yourTurnSound = document.getElementsByTagName("audio")[0];
	// waiting message
	waitingMsg = document.getElementById("waitingForPlayers");
	// hook up name button
	var submit = document.getElementById("submitBtn");
	submit.onclick = function() {
		console.log("join");
		attemptJoin();
	}
	// handles communication with the server
	setupSocketIO();
	// debugging and talking to the player
	outputDiv = document.getElementById("resultsInner");
	// if there is an error, output it so the user can see
	mobileDebug(true);
	
	// offline
	if (window.location.toString()[0] == "f") {
		//document.getElementById("nameScreen").style.display = "none";
		//document.getElementById("controllerScreen").style.display = "block";
	}
	
	inventoryInit();
}

// join a game
function attemptJoin() {
	name = document.getElementById("nameInput").value;
	roomKey = document.getElementById("roomInput").value.toUpperCase();
	var json = '{ "name": "' + name + '", ' + '"roomKey": "' + roomKey + '" }';
	socket.emit('join', json);
}

// game replied OK
function joinSucceed() {
	document.getElementById("nameScreen").style.display = "none";
	document.getElementById("controllerScreen").style.display = "block";
	// show welcome msg
	output("Welcome, "+name);
}

// if there was an error, alert
function joinFail(status) {
	alert(status);
}

// print to the onscreen log
function output(str) {
	outputDiv.innerHTML = str + "<br>" + outputDiv.innerHTML.substring(0,2000);
}

// start a turn (not used)
function turnStart() {
	setControlsVisibility(true);
	yourTurnSound.play();
}

// show the movement controls
function setControlsVisibility(visible) {
	if (visible) {
		controls.style.opacity = 1;
		controls.style.pointerEvents = 'auto';
		waitingMsg.style.display = "none";
		window.clearTimeout(failSafe);
	}
	else {
		controls.style.opacity = 0;
		controls.style.pointerEvents = 'none';
		waitingMsg.style.display = "block";
		failSafe = window.setTimeout(updateFailed, 5000)
	}
}

// if the connection times out, the controls might be locked
function updateFailed() {
	setControlsVisibility(true);
	alert("failsafe triggered after 5 seconds of no message from the server");
}

// set the healthbar
function setHealthBar(percent) {
	hpBar.style.width = "" + (percent*100) + "%"
}

// debugger
function mobileDebug(enabled) {
	if (enabled) {
		window.onerror = function(errorMsg, url, linenumber) { handleErrorMobile(errorMsg, url, linenumber); };
	} else {
		//dbg.style.display = "none";
	}
}
function handleErrorMobile(errorMsg, url, linenumber) {
	output(errorMsg + ": line " + linenumber);
}

// When the game gives a response, record it 
function handleMessageFromGame(msg) {
	// player got an item
	if (msg.indexOf("ITEM GET: ") > -1) {
		// add to inventory (handled in inventory.js)
		itemGet(msg.substring(10));
	}
}

// window onload, initialize
window.addEventListener('load',appInit);

// button pressed, make quick adjustments
function preSendActions(btnType) {
	// if the action involved an inventory item
	if (btnType.indexOf("drink") >= 0) {
		// send item info to the game
		itemInfo = btnType.substring(btnType.indexOf("[")+1,btnType.indexOf("]"));
	}
}

function postSendActions(btnType) {
	if (btnType.indexOf("drink") >= 0) {
		drinkPotion(itemInfo);
		// clear meta
		itemInfo = "";
	}
}

function simulateButtonPress(buttonString) {
	// change the item text to fit
			preSendActions(buttonString);
			
			// create a json string with information about the controller's button press
			var jsonString = '{'
			+'"name": "'+name+'", '
			+'"btn": "'+buttonString+'", '
			+'"item": "'+itemInfo+'" }';
			socket.emit('input', jsonString);
			
			// empty inventory slot
			postSendActions(buttonString);
}

// setup sockets
function setupSocketIO() {
  var buttons = document.querySelectorAll("td");
  for (var i=0; i<buttons.length; i++) {
  	  // universal touch event for all buttons
	  var setClick = function(btn) {
	  	  // only fire one of these, click or touch, not both
	      btn.addEventListener("click",function(){
			simulateButtonPress(btn.textContent);
			return false;
		  });
		  // use this for mobile
		  // commented out because it doesn't work with mouse
		  /*btn.addEventListener("touchstart",function(){
			simulateButtonPress(btn.textContent);
			return false;
		  });*/
	   }
	   setClick(buttons[i]);
  }
  socket.on('output', function(msg) {
  	handleMessageFromGame(msg)
	output(msg);
  });
  socket.on('join status', function(status) {
	if (status == "success")
		joinSucceed();
	else {
		joinFail(status);
	}
  });
}