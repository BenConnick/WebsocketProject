// *** THE DUNGEON ***

var tileTypes = { "FLOOR" : 0, "WALL" : 1, "DOOR" : 2, "WATER" : 3, "STAIRS_DOWN": 4, "STAIRS_UP": 5 };
Object.freeze(tileTypes);
var tileColors = [ "grey", "red", "yellow", "blue" ];
var images = {
	tileset: undefined
}
images.tileset = new Image();
images.tileset.src = "images/rothens_tiles_2.png";
var tileImgWidth = 32;
var minRoomDimension = 5;

function Dungeon() {
	// list of tile maps
	this.floors = [];
	this.addFloor = function(w_,h_) {
		var f = new Floor(w_,h_);
		f.generate(); // procedurally create walls and doors
		this.floors.push(f);
	};
}

// a floor object (tile map)
function Floor(w_, h_) {
	this.width = w_;
	this.height = h_;
	// tile representation
	this.grid = [];
	// enemies
	// list of enemies
	this.enemies = [];
	// create a grid with [width] columns
	for (var i=0; i<w_; i++) {
		var col = [];
		// create a column with [height] tiles
		for (var j=0; j<h_; j++) {
			col.push(tileTypes.FLOOR);
		}
		this.grid.push(col);
	}
	// the root node
	this.root = null;
	
	// list of the rooms
	this.rooms = [];
	
	// create the walls and whatnot
	this.generate = function() {
		// create the root
		var root = new Partition();
		root.width = this.width - 1;
		root.height = this.height - 1;
		
		// create the room binary tree
		this.root = SubdivideRecursively(root,true,minRoomDimension,true);
		
		// fill list of rooms
		this.rooms = listRooms(this.root);
		this.rooms.forEach(function(room) {
			room.visible = false;
		});
		
		// add walls
		this.createWalls(this.rooms);
		
		// add doors
		this.createDoors(this.root,true);
		
		// create down stairs
		var endNum = Math.floor(Math.random()*(this.rooms.length-1));
		if (endNum >= startNum) endNum++; // don't end in the same room as start
		var dsx = this.rooms[endNum].x+Math.floor(this.rooms[endNum].width/2);
		var dsy = this.rooms[endNum].y+Math.floor(this.rooms[endNum].height/2);
		this.grid[dsx][dsy] = tileTypes.STAIRS_DOWN;
		this.stairsPos = {x: dsx, y: dsy};
		
		// start in random room
		var startNum = Math.floor(Math.random()*this.rooms.length);
		// random room that is not the same as the end room
		for (var l=0; l<100; l++) {
			if (startNum == endNum) {
				startNum = Math.floor(Math.random()*this.rooms.length);
			} else {
				break;
			}
		}
		// create up stairs
		this.rooms[startNum].visible = true;
		this.spawn = { x: this.rooms[startNum].x+1, y: this.rooms[startNum].y+1 };
		spawn.x = this.spawn.x;
		spawn.y = this.spawn.y;
		
		// create up stairs
		this.grid[spawn.x][spawn.y] = tileTypes.STAIRS_UP;
		
		// populate rooms
		this.populateRooms(this.rooms, startNum);
		
		// create up stairs
		this.grid[spawn.x][spawn.y] = tileTypes.STAIRS_UP;
	};
	
	this.populateRooms = function(rooms, startRoomNum) {
		for (var i=0; i<rooms.length; i++) {
			if (i == startRoomNum) continue;
			// decide how many and how powerful enemies in this room could potentially be
			var roomThreatLevel = Math.ceil(currentFloorNum * (rooms[i].width*rooms[i].height/200.0) * (players.length+1)); // 1 to 4 inclusive + floorNum
			console.log("room"+i+" threat level: " + roomThreatLevel);
			// decide how many pieces of loot in this room
			var lootHere = Math.random()*rooms[i].width*rooms[i].height/5.0;
			// place loot
			for (var j=0; j<Math.floor(lootHere); j++) {
				var x = rooms[i].x+1 + Math.floor(Math.random()*(rooms[i].width-1));
				var y = rooms[i].y+1 + Math.floor(Math.random()*(rooms[i].height-1));
				var num = Math.ceil(Math.random()*(currentFloorNum+1));
				var  lootType = Math.floor(Math.random()*4);
				switch(lootType) {
					case 0:
						var item = new GoldPile(x,y,num); 
						break;
					case 1:
						var item = new Potion(x,y,"red"); 
						break;
					case 2:
						var item = new Potion(x,y,"green"); 
						break;
					case 3:
						var item = new Potion(x,y,"blue"); 
						break;
				}
				
				item.setRoomNum(i);
				this.items.push(item);
			}
			// spawn enemies
			while (roomThreatLevel > 0) {
				var x = rooms[i].x+1 + Math.floor(Math.random()*(rooms[i].width-1));
				var y = rooms[i].y+1 + Math.floor(Math.random()*(rooms[i].height-1));
				var enemy = createRandomEnemy(0,roomThreatLevel);
				roomThreatLevel-=enemy.lvl;
				enemy.x = x; enemy.y = y;
				enemy.setRoomNum(i);
				this.enemies.push(enemy);
			}
		}
	};
	
	// changes the tiles to wall tiles
	this.createWalls = function(rooms) {
		var thisFloor = this;
		rooms.forEach(function(room) {
			for (var i=room.y; i< (room.y+room.height + 1); i++) {
				thisFloor.grid[room.x][i] = tileTypes.WALL;
				thisFloor.grid[room.x + room.width][i] = tileTypes.WALL;
			}
			for (var i=room.x; i< (room.x+room.width + 1); i++) {
				thisFloor.grid[i][room.y] = tileTypes.WALL;
				thisFloor.grid[i][room.y + room.height] = tileTypes.WALL;
			}
		});
	}
	
	// puts gaps in the walls
	this.createDoors = function(root, horiz) {
		if (root.left && root.right) {
			this.addDoor(root, horiz);
			this.createDoors(root.left,!horiz);
			this.createDoors(root.right,!horiz);
		}
	}
	
	this.addDoor = function(cell, horiz) {
		if (horiz) {
			var found = false;
			var tries = 0;
			while (!found && tries < 100) {
				var h = cell.left.y + Math.floor(Math.random()*(cell.left.height-1));
				var w = cell.left.x+cell.left.width;
				//console.log("" + this.grid[w+1,h] + "," + this.grid[w,h] + "," + this.grid[w-1,h]);
				if (this.grid[w+1][h] == tileTypes.FLOOR && 
					this.grid[w-1][h] == tileTypes.FLOOR) {
					// create door
					this.grid[w][h] = tileTypes.DOOR;
					found = true;
				}
				tries++;
			}
		} else {
			var found = false;
			var tries = 0;
			while (!found && tries < 100) {
				var w = cell.left.x + Math.floor(Math.random()*(cell.left.width-1));
				var h = cell.left.y+cell.left.height;
				if (w > 19) { 
					//console.log(w); 
				}
				if (this.grid[w][h+1] == tileTypes.FLOOR &&
					this.grid[w][h-1] == tileTypes.FLOOR) {
					// create door
					this.grid[w][h] = tileTypes.DOOR;
					found = true;
				}
				tries++;
			}
		}
	}
	
	this.openDoor = function(x,y) {
		if (this.grid[x][y] == tileTypes.DOOR) {
			this.rooms[getRoomIdxFromTile(x,y,this.rooms)].visible = true;
			this.rooms[getRoomIdxFromTile(x-1,y-1,this.rooms)].visible = true;
		}
	}
	
	// pickups on this floor 
	this.items = [];
	// enemies on this floor
	this.enemies = [];
	this.display = function (ctx) {
		ctx.fillStyle = "black";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		// how big tiles normally look
		var tileSize = constants.tileSize;
		// tile size is proportional to the amount of space (what?)
		//var screenTileSize = Math.min(canvas.width/this.width, canvas.height/this.height);
		// scale the whole thing based on how many tiles can fit
		//var scale = screenTileSize / tileSize;
		// first move the grid so that the center is in the center
		ctx.save();
		//ctx.translate(-1*this.width*this.tileSize / 2, -1*this.height*this.tileSize / 2);
		//ctx.scale(scale, scale);
		
		// get floor reference for use in anonymous func
		var floor = this;
		
		// loop through rooms
		this.rooms.forEach(function(room) {
			//ctx.fillRect((room.x+1)*tileSize, (room.y+1)*tileSize, (room.width-1)*tileSize, (room.height-1)*tileSize);
			// only draw visible rooms
			if (room.visible) {
				// loop through room
				for (var i=0; i<room.width+1; i++) {
					for (var j=0; j<room.height+1; j++) {
						//ctx.fillStyle = tileColors[floor.grid[room.x+i][room.y+j]];
						var type = floor.grid[room.x+i][room.y+j];
						//ctx.fillRect((room.x+i)*tileSize,(room.y+j)*tileSize,tileSize,tileSize);
						ctx.drawImage(images.tileset,tileImgWidth*type,0,32,32,(room.x+i)*tileSize,(room.y+j)*tileSize,tileSize,tileSize);
					}
				}
			}
		});
		//console.log(i*j);
		ctx.restore();
	}
	
}

// partition class
function Partition(x,y,width,height) {
	this.x = x || 0;
	this.y = y || 0;
	this.width = width || 0;
	this.height = height || 0;
	
	this.left = undefined;
	this.right = undefined;
}

// try to create children partitions all the way down
function SubdivideRecursively(cell, horiz, min, random) {
	var children = Subdivide(cell, horiz, min);
	if (children != undefined) {
		cell.left = children[0];
		cell.right = children[1];
		var o1 = 0;
		var o2 = 0;
		if (random) {
			r1 = Math.floor(Math.random()*4);
			r2 = Math.floor(Math.random()*4);
			if (r1 > 1) o1 = r1;
			if (r2 > 1) o2 = r2;
		}
		SubdivideRecursively(cell.left, !horiz, min + o1);
		SubdivideRecursively(cell.right, !horiz, min + o2);
	}
	return cell;
}

// create children partitions of this cell
function Subdivide(cell, horiz, min) {
	if ((horiz && cell.width < min) || (!horiz && cell.height < min)) { 
	//console.log("could not divide");
	return;
	}
	var children = [];
	if (horiz) {
		var div = 3 + Math.ceil(Math.random() * (cell.width - 6));
		//console.log("divided horizontally at "+div);
		children[0] = new Partition(cell.x, cell.y, div, cell.height);
		children[1] = new Partition(cell.x + div, cell.y, cell.width - div, cell.height);
	} else {
		var div = 3 + Math.ceil(Math.random() * (cell.height - 6));
		//console.log("divided vertically at "+div);
		children[0] = new Partition(cell.x, cell.y, cell.width, div);
		children[1] = new Partition(cell.x, cell.y + div, cell.width, cell.height - div);
	}
	return children;
}

// get teh leaf nodes
function listRooms(root) {
	var rooms = [];
	traverseTree(rooms, root);
	return rooms;
}

// recurse and add the the list when you hit bottom
function traverseTree(list, node) {
	if (node.left == null && node.right == null) {
		list.push(node);
	} else { 
		if (node.left != null) traverseTree(list, node.left);
		if (node.right != null) traverseTree(list, node.right);
	}
}

// given coordinates, find which room contains those coordinates
function getRoomIdxFromTile(x,y,rooms) {
	for (var i=0; i<rooms.length; i++) {
		if (rooms[i].x <= x && x < rooms[i].x + rooms[i].width) {
			if (rooms[i].y <= y && y < rooms[i].y + rooms[i].height) {
				return i;
			}
		}
	}
}