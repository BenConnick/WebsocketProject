// *** global scope character data ***

// how much xp is needed to reach this level
var xpRequirements = [
	5,15,30,50,75,100
];
// store all possible images
var characterImages = [];
for (var i=1; i<7; i++) {
	createDwarfImg(i);
}
// load all the images
function createDwarfImg(i) {
	var img = new Image();
	img.src = "images/dwarf"+i+".png";
	characterImages.push(img);
}

// *** PLAYER CLASS ***
function Player(name_, type_) {
	// call parent constructor
	Character.call(this, name_);
	
	// *** character rpg attributes ***
	// name
	this.name = name_ || "unnamed";
	// lvl
	this.lvl = 1;
	// xp
	this.xp = 0;
	// hp
	this.maxHp = 15;
	this.hp = 15;
	// strength
	this.strength = 4;
	// intelligence
	this.intelligence = 1;
	// defense
	this.defense = 2; // dodge chance
	this.dodge = function(attackerdefense) { 
		return (Math.random() < this.defense/(this.defense+attackerdefense*10)) ? true : false; 
	};
	// define as player
	this.isPlayer = true;
	// class (type)
	this.type = type_ || "Strong Murderhobo";
	// weapon
	this.weapon = weapons["stick"];
	// differentiate characters
	this.color = Math.floor(Math.random() * 5);
	this.image = characterImages[this.color];
	this.inventory = [];
	// drawing
	this.visible = true;
	
	// add xp for
	this.addXp = function(val) {
		this.xp+=val;
		this.checkForLvlUp();
	}
	
	// check to see if the player has enough xp
	this.checkForLvlUp = function() {
		if (this.lvl < this.xp - xpRequirements[this.lvl-1]) {
			// level up!!!
			this.lvl++;
			this.hp += Math.ceil(this.hp / (this.maxHp + 10));
			this.maxHp += 10;
			this.strength+=2;
			this.defense+=2;
			this.intelligence+=2;
			//this.hp = this.maxHp; mwahaha, no more free hp for you
		}
	}
	
	// throw an item (currently limited to potions)
	this.throwItem = function(itemName, direction) {
		// debug
		console.log("throwing "+itemName+" "+direction);
		// remove from inventory
		var item = this.inventory.splice(this.inventory.indexOf(itemName),1);
		// find out where the potion will land
		var landingSpot = this.getProjection(direction);
		// which effect?
		var effect = potionTypes[itemName];		
		// apply effect based on what the item hits
		var target = gameTools.checkForEnemy(landingSpot.x,landingSpot.y);
		// if the target exists and so does the effect
		if (target && effect) {
			target.applyEffect(effect, this);
		} else if (effect == "lightning potion") {
			powers.lightningBurst(this,landingSpot.x,landingSpot.y);
		}
	}
	
	// apply a potion's effect to the player
	this.drinkPotion = function(itemName) {
		// debug
		console.log("drinking "+itemName);
	
		// remove from inventory
		let item = this.inventory.splice(this.inventory.indexOf(itemName),1);
		// check valid
		if (!item) { return; }
		// which effect?
		var effect = potionTypes[itemName];		
		// apply
		if (effect) this.applyEffect(effect, this);
	}	
	
	this.checkAndResolveCollision = function(x,y) {
		
		// look for enemy
		var target = gameTools.checkForEnemy(x,y);
		// attack
		if (target) {
			this.attack(target);
			return true;
		}
		
		// look for loot
		target = gameTools.checkForItem(x,y);
		if (target) {
			var  msg = "ITEM GET: " + target.name;
			if (target.name == "gold") {
				this.gold += target.num;
				msg += " " + target.num;
			} else {
				this.inventory.push(target);
			}
			// update the controller inventory
			send(this.name,msg);
			target.removeFromFloor();
			return true;
		}
	}
	
	this.hitWall = function() {
		// message phone
		send(this.name,"you hit a wall");
	}
	
	this.death = function() {
		// kill
		console.log("you died");
		send(this.name,"you died");
		//this.reset();
		this.gold = 0;
		// respawn
		this.x = spawn.x;
		this.y = spawn.y;
		this.hp = this.maxHp;
	}
	this.reset = function() {
		// lvl
		this.lvl = 1;
		// xp
		this.xp = 0;
		// hp
		this.maxHp = 15;
		this.hp = 15;
		// strength
		this.strength = 4;
		// defense
		this.defense = 2;
		// respawn
		this.x = spawn.x;
		this.y = spawn.y;
	}
}
// inheritance
Player.prototype = Object.create(Character.prototype);
Player.prototype.constructor = Player;

