// *** GAME SCRIPT ***

// canvas elem
var canvas;
var ctx;
// the dungeon object
var dungeon;
// the spawn point on the current floor
var spawn = { x: 0, y: 0};
// the lowest floor the player has been to
var bottomFloorNum = -1;
// the current floor index
var currentFloorNum = -1;
// floor reference
var currentFloor;
// the list of players
var players = [];
// A* nodes
var nodeMap = [];
// timer
var startTime = 0;	
var gameTime = 0; 
var skippedTime = 0;
var turnCount = 0;
var turnInterval = 500;
// offline if file url
var offline = (window.location.toString()[0] == "f");
console.log(offline);
var gridDimensions = { x: 18, 	y: 12 };

// initialize variables
function init() {
	canvas = document.querySelector("canvas");
	document.querySelector("#fullscreenBtn").onclick = fullScreen;
	canvas.onclick = fullScreen;
	ctx = canvas.getContext("2d");
	
	dungeon = new Dungeon();
	startGame();
}
window.addEventListener('load',init);

function fullScreen() {
	var elem = canvas;
	if (elem.requestFullscreen) {
	  elem.requestFullscreen();
	} else if (elem.msRequestFullscreen) {
	  elem.msRequestFullscreen();
	} else if (elem.mozRequestFullScreen) {
	  elem.mozRequestFullScreen();
	} else if (elem.webkitRequestFullscreen) {
	  elem.webkitRequestFullscreen();
	}
}

function startGame() {
	// start the timer
	gameTime = startTime = Date.now();
	
	// enter a dungeon
	goToFloor(0);
	
	// if off-line create a character and activate keyboard controls
	if (offline) activateOfflineCharacter();
	
	gameLoop();
}

function activateOfflineCharacter() {
	addPlayer("offline");
	window.addEventListener("keydown",function(e) {
		if (e.ctrlKey) {
			// go down stairs
			handlePlayerInput('{ "name": "offline", "btn": "use [stairs]" }');
		}
	});
	window.addEventListener("keypress",function(e) {
        console.log(e.keyCode);
		switch(e.keyCode) {
            case 97:
			case 37:
				// left
				handlePlayerInput('{ "name": "offline", "btn": "LEFT" }');
				break;
            case 119:
			case 38:
				// up
				handlePlayerInput('{ "name": "offline", "btn": "UP" }');
				break;
            case 100:
			case 39:
				// right
				handlePlayerInput('{ "name": "offline", "btn": "RIGHT" }');
				break;
            case 115:
			case 40:
				// down
				handlePlayerInput('{ "name": "offline", "btn": "DOWN" }');
				break;
		}
	});
}

// every tick
function gameLoop() {
	//console.log("lop");
	gameTime = skippedTime + Date.now() - startTime;
	if (gameTime - turnCount*turnInterval > turnInterval) {
		turnCount++;
		update();
	}
	draw();
	//window.setTimeout(gameLoop,250);
	window.requestAnimationFrame(gameLoop);
}

// modify turn-based game values
function update() {
	currentFloor.enemies.forEach(function(enemy) {
		if (currentFloor.rooms[enemy.roomNum].visible)
			enemy.updateBehavior();
	});
	players.forEach(function(player) {
		player.actionsLeft = 1;
		//send(player.name,"Your turn. Health: "+(player.hp/player.maxHp)); // send the controller an update
		//send(player.name,"Your turn "+Date.now()); // send the controller an update
		//player.x = player.futurePos.x;
		//player.y = player.futurePos.y;
	});
}

// draw to the screen
function draw() {
	// reset transform (scale 3)
	var gScale = 2;
	ctx.setTransform(gScale, 0, 0, gScale, 0, gScale);
	// draw floor
	currentFloor.display(ctx);
	
	// asfdasdfasfd
	var index = 0;
	// draw players
	players.forEach(function(player) {
		index++;
		if (player.visible) {
			player.draw(ctx);
		}
		if (player.actionsLeft == 0) {
			console.log(player.actionsLeft);
			ctx.globalAlpha = 1;
			ctx.fillStyle = "white";
			ctx.beginPath();
			console.log(i);
			//ctx.arc(100,100,30,0,2*Math.PI,true);
			ctx.arc(canvas.width/2 - 40,10 + 15*index,10,0,2*Math.PI,true);
			//ctx.arc(canvas.width - 40,20+20*i,10,0,2*Math.PI);
			ctx.closePath();
			ctx.fill();
			ctx.fillStyle = "black";
			ctx.fillText("P"+index,canvas.width/2 - 46,14 + 15*index);	
		}
	});
	// draw enemies
	currentFloor.enemies.forEach(function(enemy) {
		if (currentFloor.rooms[enemy.roomNum].visible)
			enemy.draw(ctx);
	});
	currentFloor.items.forEach(function(item) {
		if (currentFloor.rooms[item.roomNum].visible)
			item.draw(ctx);	
	});
	// draw the effects
	effectsManager.updateAll();
	effectsManager.drawAll(ctx);
	// draw the "timer" indicator
	//drawTimer(ctx,{x: 600, y: 50},gameTime%turnInterval/turnInterval);
	
}

// generate a new dungeon floor
// or go back to a previous one
function goToFloor(level) {
	// error checking
	if (!level || level < 0) level = 0;
	
	// set floor
	currentFloorNum = level;

	// if up
	if (level <= bottomFloorNum) {
		// load floors[level]
	}
	// if down
	else {
		// bottom is deeper
		bottomFloorNum++;
		// generate new floor
		dungeon.addFloor(gridDimensions.x,gridDimensions.y);
		/*nodeMap.length
		// create nodes
		var map = [];
		// create a grid with [width] columns
		for (var i=0; i<currentFloor.width; i++) {
			var col = [];
			// create a column with [height] tiles
			for (var j=0; j<currentFloor.height; j++) {
				col.push(new Node(i,j));
			}
			// double nested
			map.push(col);
		}
		// triple nested
		nodeMap.push(map);
		*/
		
	}
	
	// set current reference
	currentFloor = dungeon.floors[currentFloorNum];
	
	// adjust spawn point
	spawn.x = currentFloor.spawn.x;
	spawn.y = currentFloor.spawn.y;
}

// shows the tiles in a room
function displayRoom(room) {

}

// deals with controller inputs
function handlePlayerInput(msg) {
	console.log("input: " + msg);
	var inputData = JSON.parse(msg);
	var p = getPlayer(inputData.name);
	if (!p) p = addPlayer(inputData.name);
	if (inputData.btn.indexOf("THROW") >= 0) {
		// extract direction (after THROW_)
		var direction = inputData.btn.substring(6, inputData.btn.length);
		// throw the item
		p.throwItem(inputData.item, direction); 
	} else if (inputData.btn.indexOf("drink") >= 0) {
		// drink the potion
		p.drinkPotion(inputData.item);
	} else {
		p.move(inputData.btn, currentFloor);
	}
	checkForAllReady();
}

function checkForAllReady() {
	var done = true;
	players.forEach(function(player) {
		if (player.actionsLeft > 0) done = false;
	});
	// if done, skip to turn end
	if (done) {
		// shorthand
		var gameTime = skippedTime + Date.now() - startTime;
		// skip ahead to next turn
		skippedTime += (turnInterval - (gameTime - turnCount*turnInterval));
	}
}

// retrieves a player with a given name
function getPlayer(name) {
	for (var i=0; i<players.length; i++) {
		if (players[i].name == name)
		return players[i];
	}
}

function addPlayer(name, type) {
	if (getPlayer(name)) return;
	console.log("added " + name);
	var newb = new Player(name,type);
	newb.x = spawn.x;
	newb.y = spawn.y;
	newb.prevPos.x = spawn.x;
	newb.prevPos.y = spawn.y;
	players.push(newb);
	return newb;
	console.log(players);
}

function drawTimer(ctx,pos,percent) {
	ctx.save();
	ctx.fillStyle = "white";
	ctx.beginPath();
	ctx.arc(pos.x,pos.y,30,0,2*Math.PI*(percent),true);
	ctx.lineTo(pos.x,pos.y);
	ctx.closePath();
	ctx.globalAlpha = 0.1;
	ctx.fill();
	ctx.restore();
}