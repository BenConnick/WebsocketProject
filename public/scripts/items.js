// *** ITEM CLASSES ***

var weapons = {
	"stick" : {
		name: "stick",
		power: 1
	},
	"broomhandle" : {
		name: "broomhandle",
		power: 2
	}
}

// which color does what? randomized at start
var potionTypes = {
	"red potion" : "health potion",
	"green potion" : "strength potion",
	"blue potion" : "lightning potion"
}

// possible potion effects
var potionEffectsList = [
	"healing potion",
	"strength potion",
	"lightning potion"
]

// Item base class
function Item(x, y, name) {
	GameObject.call(this,x,y);
	this.name = name || "no name";
	this.roomNum = -1;
	this.setRoomNum = function(num) {
		this.roomNum = num;
	}
	this.image = undefined;
	this.draw = function() {
		ctx.drawImage(this.image,this.x*constants.tileSize,this.y*constants.tileSize);
	};
	this.removeFromFloor = function() {
		this.roomNum = -1;
		currentFloor.items.splice(currentFloor.items.indexOf(this),1);
	}
}
// inherit from parent
Item.prototype = Object.create(GameObject.prototype);
Item.prototype.constructor = Item;



// the standard constructor for a gold pile
function GoldPile(x_, y_, num_) {
	Item.call(this,x_,y_,"gold");
	this.num = num_;
	this.image = new Image();
	this.image.src = "images/Gold.png";
}
// inherit from parent
GoldPile.prototype = Object.create(Item.prototype);
GoldPile.prototype.constructor = GoldPile;

// a magical potion of wonders
function Potion(x_, y_, type_) {
	this.type = type_ || "red";
	Item.call(this,x_,x_,this.type+" potion");
	this.image = new Image();
	this.image.src = "images/"+this.type+"potion.png";
	
}
// inherit from parent
Potion.prototype = Object.create(Item.prototype);
Potion.prototype.constructor = Potion;

