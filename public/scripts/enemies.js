// *** static functions ***
function createRandomEnemy(lvlMin,lvlMax) {
	lvlMin = lvlMin || 0;
	lvlMax = lvlMax || 1000000;
	var idxMin = lvlMin;
	var idxMax = lvlMax;
	/*for (var i=0; i<enemyTypes.length; i++) {
		if (enemyTypes[i].lvl > lvlMin) {
			idxMin = i;
		}
		if (enemyTypes[i].lvl < lvlMax) {
			idxMax = i;
		}
	}*/
	var a = idxMin + Math.floor(Math.random()*(idxMax - idxMin + 1));
	console.log("a: " + a);
	return createEnemyByTypeIndex( a );
}

function createEnemyByTypeIndex(idx) {
	switch(idx) {
		case 0:
		case 1:
			return new Rat();
			break;
		case 2:
			return new Slime();
			break;
		default:
			return new Rat();
			break;
	}
}

// list of the types of enemies
var enemyTypes = [ 
	Rat,
	Slime
	];

// *** ENEMY CLASSES ***

// base class
function Enemy() {
	// call parent constructor
	Character.call(this);
	
	// *** basic interactions ***
	this.awake = false; // sleeping until the player wakes it up
	
	// which room (relative to floor)
	this.roomNum = -1;
	// setter
	this.setRoomNum = function(num) { this.roomNum = num; };
	
	this.path = [];
	
	// overwrite this for more complex behaviors
	this.updateBehavior = function() {
		this.seekClosestPlayer();
	}
	
	// move towards closest player
	this.seekClosestPlayer = function() {
		// player to pursue
		var target;
		var playerAlreadyFoundInSameRoom = false;
		var room = currentFloor.rooms[getRoomIdxFromTile(currentFloor.rooms,this.x,this.y)];
		var minDist = 1000000;	
		// reference to this enemy inside anon func
		var e = this;
		// players is a global var
		players.forEach(function(p) {
			// player is in the same room as enemy
			if (currentFloor.rooms[getRoomIdxFromTile(currentFloor.rooms,p.x,p.y)] == room) {
				if (!playerAlreadyFoundInSameRoom) {
					target = p;
					var distSq = (p.x-e.x)*(p.x-e.x) + (p.y-e.y)*(p.y-e.y);
					minDist = distSq;
					playerAlreadyFoundInSameRoom = true;
				} else {
					var distSq = (p.x-e.x)*(p.x-e.x) + (p.y-e.y)*(p.y-e.y);
					if (distSq < minDist) {
						minDist = distSq;
						target = p;
					}
				}
			} else {
				if (!playerAlreadyFoundInSameRoom) {
					var distSq = (p.x-this.x)*(p.x-this.x) + (p.y-this.y)*(p.y-this.y)
					if (distSq < minDist) {
						minDist = distSq;
						target = p;
					}
				}
			}
		});
		
		// if there is no target, escape
		if (!target) return;
		
		//var map = nodeMap[currentFloorNum];
		/*var closestPointToPlayer
		this.path = Astar(
			map, 
			map[this.x][this.y], 
			map[target.x][target.y],
			dungeon.floors[currentFloorNum].width);
		*/
		
		var dir;
		var vert = 0;
		var horiz = 0;
		if (this.x > target.x) {
			dir = "LEFT";
			horiz = -1;
		} else if (this.x < target.x) {
			dir = "RIGHT";
			horiz = 1;
		} else if (this.y < target.y) {
			dir = "DOWN";
			vert = -1;
		} else if (this.y > target.y) {
			dir = "UP";
			vert = +1;
		} else {
			// on top of player
		}
		var result;
		if (dir)
			result = this.move(dir,dungeon.floors[currentFloorNum]);
		if (result == "wall") {
			/*for (var i=0; i<50; i++) {
				//currenFloor.grid[
			}*/
		}
	}
}
// inherit from parent
Enemy.prototype = Object.create(Character.prototype);
Enemy.prototype.constructor = Enemy;

var ratImg = new Image();
ratImg.src = "images/rat.png";
// rat class
function Rat() {
	// call parent constructor
	Enemy.call(this);
	
	// image
	this.image = ratImg;
	
	// *** enemy rpg attributes ***
	this.name = "Rat";
	// threat level
	this.lvl = 1;
	// xp when killed
	this.xp = 1;
	// weapon
	this.weapon = weapons["stick"]; // start with a basic weapon
	// hp
	this.hp = 4;
	this.maxHp = 4;
	// strength
	this.strength = 4;
	// defense
	this.defense = 2; // dodge chance
	
	// draw with offset because the sprite is short
	this.offsetY = 10;
	
	this.updateBehavior = function() {
		this.seekClosestPlayer();
	}
}
// inherit from parent
Rat.prototype = Object.create(Enemy.prototype);
Rat.prototype.constructor = Rat;
Rat.prototype.lvl = 1; // used by the createRandomEnemy func

var slimeImg = new Image();
slimeImg.src = "images/slime.png";
// slime class
function Slime() {
	// call parent constructor
	Enemy.call(this);
	
	// image
	this.image = slimeImg;
	
	// *** enemy rpg attributes ***
	this.name = "Green Slime";
	// threat level
	this.lvl = 2;
	// xp when killed
	this.xp = 3;
	// weapon
	this.weapon = weapons["stick"]; // start with a basic weapon
	// hp
	this.hp = 10;
	this.maxHp = 10;
	// strength
	this.strength = 8;
	// defense
	this.defense = 2; // dodge chance
	
	// draw with offset because the sprite is short
	this.offsetY = 10;
	
	this.updateBehavior = function() {
		this.seekClosestPlayer();
	}
}
// inherit from parent
Slime.prototype = Object.create(Enemy.prototype);
Slime.prototype.constructor = Slime;
Slime.prototype.lvl = 2; // used by the createRandomEnemy func