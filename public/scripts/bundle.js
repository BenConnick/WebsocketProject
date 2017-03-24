'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// foundational and base classes as well as misc.

// game object base class
var GameObject = function GameObject(x_, y_) {
  _classCallCheck(this, GameObject);

  this.x = x_ || 1;
  this.y = y_ || 1;
};

// *** CHARACTER BASE CLASS ***


var Character = function (_GameObject) {
  _inherits(Character, _GameObject);

  function Character(name) {
    _classCallCheck(this, Character);

    // *** RPG ATTRIBUTES ***
    // name
    var _this = _possibleConstructorReturn(this, (Character.__proto__ || Object.getPrototypeOf(Character)).call(this));
    // call parent constructor


    _this.name = name || 'unnamed';
    // lvl
    _this.lvl = 1;
    // xp
    _this.xp = 1;
    // hp
    _this.maxHp = 1;
    _this.hp = 1;
    // strength
    _this.strength = 1;
    // defense
    _this.defense = 1; // dodge chance
    _this.dodge = function (attackerdefense) {
      return Math.random() < this.defense / (this.defense + attackerdefense * 10);
    };
    _this.zapped = false;

    // *** CHARACTER UTILITY ***
    // player only boolean
    _this.isPlayer = false;
    // don't allow player input if the player has already acted this turn
    _this.actionsLeft = 1;
    // store player input here until it can be used
    _this.futurePos = { x: _this.x, y: _this.y };

    // *** DRAWING AND ANIMATION ***
    // base sprite
    _this.image = undefined;
    // offset for drawing
    _this.offsetX = 0;
    _this.offsetY = 0;
    // when hit by an attack
    _this.shakingTimer = 0; // not implemented
    // when attacking
    _this.attackDirection = 0; // not implemented
    _this.attackDirection = -1; // directions 0 to 3
    // moving
    _this.prevPos = { x: 0, y: 0 };
    _this.moveTransitionStart = 0;
    _this.moveTransitionDuration = 100;
    return _this;
  }

  // *** METHODS ***
  // move one space given a direction and grid info


  _createClass(Character, [{
    key: 'move',
    value: function move(dir, floor) {
      // check for able to act
      if (this.actionsLeft < 1) return;
      // subtract action
      // if (this.isPlayer) this.actionsLeft--; MOVEMENT IS NO LONGER TURN BASED
      if (dir === 'use [stairs]') {
        // Go DOWN
        if (this.x === currentFloor.stairsPos.x && this.y === currentFloor.stairsPos.y) {
          // if standing on stairs "ready"
          if (this.visible) {
            this.visible = false;
          }
          // unready
          else {
              this.visible = true;
            }

          // check if all players are ready
          for (var i = 0; i < players.length; i++) {
            if (players[i].visible) {
              return; // player is not ready, do not go down a floor
            }
          }
          // if all ready
          goToFloor(currentFloorNum + 1);
          players.forEach(function (p) {
            p.x = currentFloor.spawn.x;
            p.y = currentFloor.spawn.y;
            p.visible = true;
          });
          // Go UP
        } else if (this.x === spawn.x && this.y === spawn.y && currentFloorNum > 0) {
          // if standing on stairs "ready"
          if (this.visible) {
            this.visible = false;
          }
          // unready
          else {
              this.visible = true;
            }
          // check if all players are ready
          for (var i = 0; i < players.length; i++) {
            if (players[i].visible) {
              return; // player is not ready, do not go up a floor
            }
          }
          // if all ready
          goToFloor(currentFloorNum - 1);
          players.forEach(function (p) {
            p.x = currentFloor.stairsPos.x;
            p.y = currentFloor.stairsPos.y;
            p.visible = true;
          });
        }
        return;
      }

      // don't let invisible characters walk around
      if (this.visible === false) return;

      var projection = this.getProjection(dir);

      // moving is an attack if the space is occupied
      var collisionOccured = this.checkAndResolveCollision(projection.x, projection.y);
      if (collisionOccured) {
        // do nothing more, handled in checkAndResolveCollision
      } else if (floor.grid[projection.x][projection.y] === tileTypes.WALL) {
        if (this.hitWall) this.hitWall();
      } else {
        this.prevPos.x = this.x;
        this.prevPos.y = this.y;
        this.x = projection.x;
        this.y = projection.y;
        this.moveTransitionStart = Date.now();
        currentFloor.openDoor(this.x, this.y);
      }

      // clear residual effects
      this.zapped = false;
    }
  }, {
    key: 'getProjection',
    value: function getProjection(dir) {
      var projection = { x: this.x, y: this.y };
      switch (constants.directions[dir]) {
        case constants.directions.LEFT:
          projection.x = this.x - 1;
          break;
        case constants.directions.UP:
          projection.y = this.y - 1;
          break;
        case constants.directions.RIGHT:
          projection.x = this.x + 1;
          break;
        case constants.directions.DOWN:
          projection.y = this.y + 1;
          break;
      }
      return projection;
    }
  }, {
    key: 'checkAndResolveCollision',
    value: function checkAndResolveCollision(x, y) {
      // get target of the appropriate type
      var target = gameTools.checkForOpponent(this.isPlayer, x, y);
      // attack
      if (target) {
        this.attack(target);
        return true;
      }
    }
  }, {
    key: 'damage',
    value: function damage(num, xpCallback) {
      this.hp -= num;
      if (this.hp > this.maxHp) {
        this.hp = this.maxHp;
      }
      if (this.hp <= 0) {
        console.log(this.name + ' ded');
        // if there is an xpCallback
        if (xpCallback) xpCallback(this.xp);
        if (!this.isPlayer) {
          currentFloor.enemies.splice(currentFloor.enemies.indexOf(this), 1);
        }
        // if there exists a death function
        if (this.death) this.death();
      }
      var color = this.isPlayer ? 'blue' : 'red';
      effectsManager.addHitMarker(num, { x: this.x * constants.tileSize, y: this.y * constants.tileSize }, color);
    }

    // attack target

  }, {
    key: 'attack',
    value: function attack(target) {
      // if the target is invalid, escape
      if (target.hp === undefined) return;
      // roll for dodge
      if (target.dodge(this.defense)) {
        target.damage(0);
        return;
      }
      // check for weapon
      var power = this.weapon ? this.strength + this.weapon.power : this.strength;
      // roll for damage
      var damage = Math.ceil(power / 2 + Math.random() * power / 2);
      // deal damage
      var ref = this;
      target.damage(damage, function (val) {
        if (ref.addXp) ref.addXp(val);
      });
    }

    // draw on the screen

  }, {
    key: 'draw',
    value: function draw(ctx) {
      ctx.save();

      // transition percent
      var p = Math.min(1, (Date.now() - this.moveTransitionStart) / this.moveTransitionDuration);

      // where to draw
      var drawPosX = this.x * constants.tileSize * p + this.prevPos.x * constants.tileSize * (1 - p) + this.offsetX;
      var drawPosY = this.y * constants.tileSize * p + this.prevPos.y * constants.tileSize * (1 - p) + this.offsetY;

      // draw the character sprite
      ctx.drawImage(this.image, drawPosX, drawPosY);

      // health bar background
      ctx.fillStyle = 'black';
      ctx.fillRect(drawPosX, drawPosY, 30, 2);

      // health bar percent
      ctx.fillStyle = 'red';
      ctx.fillRect(drawPosX, drawPosY, 30 * this.hp / this.maxHp, 2);

      // show status
      if (this.actionsLeft === 0) {
        ctx.globalAlpha = 0.6;
      }

      // name tag
      ctx.fillStyle = 'white';
      ctx.font = '8px Verdana';
      ctx.fillText(this.name + ' Lvl.' + this.lvl, drawPosX, drawPosY - 2);

      // restore
      ctx.restore();
    }
  }, {
    key: 'applyEffect',
    value: function applyEffect(effectName, origin) {
      // debug
      console.log('potion effect: ' + effectName);

      switch (effectName) {
        case 'strength potion':
          this.temporaryStatBoost(this.addStrength, 10, 30000);
          break;
        case 'defense potion':
          this.temporaryStatBoost(this.multiplyDefense, 10, 30000);
          break;
        case 'lightning potion':
          this.lightningBurst(origin);
          break;
        case 'health potion':
          this.damage(-20, function () {});
          break;
      }
    }

    // damage all of the spaces around a character (chain reaction)
    // origin is the character that started the lightning chain

  }, {
    key: 'lightningBurst',
    value: function lightningBurst(origin) {
      // visual
      var pos = { x: this.x * constants.tileSize, y: this.y * constants.tileSize };
      // debug
      console.log(this.name + ' is zapping everything');
      for (var x = -1; x < 2; x++) {
        for (var y = -1; y < 2; y++) {
          effectsManager.addSpark({ x: pos.x + x * constants.tileSize, y: pos.y + y * constants.tileSize });
          var target = gameTools.checkForEnemy(this.x + x, this.y + y);
          if (target) {
            // prevent infinite loop
            if (!target.zapped) {
              // mark as zapped
              target.zapped = true;
              // apply lightning damage to target, add xp if it dies
              target.lightningBurst(origin);
            }
          }
        }
      }
      // damage self last
      // this.damage(constants.lightningDamage,function(val) { if (origin.addXp) origin.addXp(val); });
    }

    // boost a stat for a set duration

  }, {
    key: 'temporaryStatBoost',
    value: function temporaryStatBoost(func, amount, duration) {
      // change stat
      func(this, amount);
      // reference to self
      var self = this;
      // if duration <= 0 the effect is permanent
      if (duration > 0) {
        // apply the opposite effect in time = duration
        window.setTimeout(function () {
          self.temporaryStatBoost(func, -1 * amount, -1);
        }, duration);
      }
    }

    // strength boost or nerf

  }, {
    key: 'addStrength',
    value: function addStrength(target, amount) {
      var color = '#3a5';
      effectsManager.addHitMarker(-1 * amount, { x: target.x * constants.tileSize, y: target.y * constants.tileSize }, color);
      target.strength += amount;
    }

    // defense boost or nerf

  }, {
    key: 'addDefense',
    value: function addDefense(target, amount) {
      var color = 'yellow';
      effectsManager.addHitMarker(amount, { x: target.x * constants.tileSize, y: target.y * constants.tileSize }, color);
      target.defense += amount;
    }
  }]);

  return Character;
}(GameObject);
// inheritance
// Character.prototype = Object.create(GameObject.prototype);
// Character.prototype.constructor = Character;

// container for helper functions


var gameTools = {
  checkForOpponent: function checkForOpponent(isPlayer, x, y) {
    if (isPlayer) {
      return gameTools.checkForEnemy(x, y);
    }
    return gameTools.checkForPlayer(x, y);
  },
  checkForPlayer: function checkForPlayer(x, y) {
    for (var i = 0; i < players.length; i++) {
      if (players[i].x === x && players[i].y === y) {
        return players[i];
      }
    }
  },
  checkForEnemy: function checkForEnemy(x, y) {
    for (var i = 0; i < currentFloor.enemies.length; i++) {
      if (currentFloor.enemies[i].x === x && currentFloor.enemies[i].y === y) {
        return currentFloor.enemies[i];
      }
    }
  },
  checkForItem: function checkForItem(x, y) {
    for (var i = 0; i < currentFloor.items.length; i++) {
      if (currentFloor.items[i].x === x && currentFloor.items[i].y === y) {
        return currentFloor.items[i];
      }
    }
  }
};

// container for powers
var powers = {
  lightningBurst: function lightningBurst(originPlayer, xStart, yStart) {
    var pos = { x: xStart * constants.tileSize, y: yStart * constants.tileSize };
    effectsManager.addSpark(pos);
    for (var x = -1; x < 2; x++) {
      for (var y = -1; y < 2; y++) {
        var target = gameTools.checkForEnemy(xStart + x, yStart + y);
        if (target) {
          // prevent infinite loop
          if (!target.zapped) {
            // mark as zapped
            target.zapped = true;
            // apply lightning damage to target, add xp if it dies
            target.lightningBurst(originPlayer);
          }
        }
      }
    }
  }
};
"use strict";

var constants = {
  tileSize: 32,
  // js enum for directions
  directions: { LEFT: 0, UP: 1, RIGHT: 2, DOWN: 3 },
  // fire damage
  lightningDamage: 10
};
Object.freeze(constants);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// *** THE DUNGEON ***

var tileTypes = { FLOOR: 0, WALL: 1, DOOR: 2, WATER: 3, STAIRS_DOWN: 4, STAIRS_UP: 5 };
Object.freeze(tileTypes);
// const tileColors = ['grey', 'red', 'yellow', 'blue'];
var images = {
  tileset: undefined
};
images.tileset = new Image();
images.tileset.src = 'images/rothens_tiles_2.png';
var tileImgWidth = 32;
var minRoomDimension = 5;

// partition class

var Partition = function Partition(x, y, width, height) {
  _classCallCheck(this, Partition);

  this.x = x || 0;
  this.y = y || 0;
  this.width = width || 0;
  this.height = height || 0;

  this.left = undefined;
  this.right = undefined;
};

// try to create children partitions all the way down


var SubdivideRecursively = function SubdivideRecursively(cell, horiz, min, random) {
  var children = Subdivide(cell, horiz, min);
  if (children != undefined) {
    cell.left = children[0];
    cell.right = children[1];
    var o1 = 0;
    var o2 = 0;
    if (random) {
      var r1 = Math.floor(Math.random() * 4);
      var r2 = Math.floor(Math.random() * 4);
      if (r1 > 1) o1 = r1;
      if (r2 > 1) o2 = r2;
    }
    SubdivideRecursively(cell.left, !horiz, min + o1);
    SubdivideRecursively(cell.right, !horiz, min + o2);
  }
  return cell;
};

// create children partitions of this cell
var Subdivide = function Subdivide(cell, horiz, min) {
  if (horiz && cell.width < min || !horiz && cell.height < min) {
    // console.log("could not divide");
    return;
  }
  var children = [];
  if (horiz) {
    var div = 3 + Math.ceil(Math.random() * (cell.width - 6));
    // console.log("divided horizontally at "+div);
    children[0] = new Partition(cell.x, cell.y, div, cell.height);
    children[1] = new Partition(cell.x + div, cell.y, cell.width - div, cell.height);
  } else {
    var _div = 3 + Math.ceil(Math.random() * (cell.height - 6));
    // console.log("divided vertically at "+div);
    children[0] = new Partition(cell.x, cell.y, cell.width, _div);
    children[1] = new Partition(cell.x, cell.y + _div, cell.width, cell.height - _div);
  }
  return children;
};

// get teh leaf nodes
// (root)
var listRooms = function listRooms(rootPartition) {
  var rooms = [];
  traverseTree(rooms, rootPartition);
  return rooms;
};

// recurse and add the the list when you hit bottom
var traverseTree = function traverseTree(list, node) {
  if (node.left === undefined && node.right === undefined) {
    list.push(node);
  } else {
    if (node.left !== undefined) traverseTree(list, node.left);
    if (node.right !== undefined) traverseTree(list, node.right);
  }
};

// given coordinates, find which room contains those coordinates
var getRoomIdxFromTile = function getRoomIdxFromTile(x, y, rooms) {
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].x <= x && x < rooms[i].x + rooms[i].width) {
      if (rooms[i].y <= y && y < rooms[i].y + rooms[i].height) {
        return i;
      }
    }
  }
};

// a floor object (tile map)

var Floor = function () {
  function Floor(w_, h_) {
    _classCallCheck(this, Floor);

    this.width = w_;
    this.height = h_;
    // tile representation
    this.grid = [];
    // enemies
    // list of enemies
    this.enemies = [];
    // create a grid with [width] columns
    for (var i = 0; i < w_; i++) {
      var col = [];
      // create a column with [height] tiles
      for (var j = 0; j < h_; j++) {
        col.push(tileTypes.FLOOR);
      }
      this.grid.push(col);
    }
    // the root node
    this.root = undefined;

    // list of the rooms
    this.rooms = [];
  }

  // create the walls and whatnot


  _createClass(Floor, [{
    key: 'generate',
    value: function generate() {
      // create the root
      var root = new Partition();
      root.width = this.width - 1;
      root.height = this.height - 1;

      // pickups on this floor
      this.items = [];
      // enemies on this floor
      this.enemies = [];

      // create the room binary tree
      this.root = SubdivideRecursively(root, true, minRoomDimension, true);

      // fill list of rooms
      this.rooms = listRooms(this.root);
      this.rooms.forEach(function (room) {
        room.visible = false;
      });

      // add walls
      this.createWalls(this.rooms);

      // add doors
      this.createDoors(this.root, true);

      // create down stairs
      var endNum = Math.floor(Math.random() * (this.rooms.length - 1));
      // if (endNum >= startNum) endNum++; // don't end in the same room as start
      var dsx = this.rooms[endNum].x + Math.floor(this.rooms[endNum].width / 2);
      var dsy = this.rooms[endNum].y + Math.floor(this.rooms[endNum].height / 2);
      this.grid[dsx][dsy] = tileTypes.STAIRS_DOWN;
      this.stairsPos = { x: dsx, y: dsy };

      // start in random room
      var startNum = Math.floor(Math.random() * this.rooms.length);
      // random room that is not the same as the end room
      for (var l = 0; l < 100; l++) {
        if (startNum === endNum) {
          startNum = Math.floor(Math.random() * this.rooms.length);
        } else {
          break;
        }
      }
      // create up stairs
      this.rooms[startNum].visible = true;
      this.spawn = { x: this.rooms[startNum].x + 1, y: this.rooms[startNum].y + 1 };
      spawn.x = this.spawn.x;
      spawn.y = this.spawn.y;

      // create up stairs
      this.grid[spawn.x][spawn.y] = tileTypes.STAIRS_UP;

      // populate rooms
      this.populateRooms(this.rooms, startNum);

      // create up stairs
      this.grid[spawn.x][spawn.y] = tileTypes.STAIRS_UP;
    }
  }, {
    key: 'populateRooms',
    value: function populateRooms(rooms, startRoomNum) {
      for (var i = 0; i < rooms.length; i++) {
        if (i === startRoomNum) continue;
        // decide how many and how powerful enemies in this room could potentially be
        var roomThreatLevel = Math.ceil(currentFloorNum * (rooms[i].width * rooms[i].height / 200.0) * (players.length + 1)); // 1 to 4 inclusive + floorNum
        console.log('room' + i + ' threat level: ' + roomThreatLevel);
        // decide how many pieces of loot in this room
        var lootHere = Math.random() * rooms[i].width * rooms[i].height / 5.0;
        // place loot
        for (var j = 0; j < Math.floor(lootHere); j++) {
          var x = rooms[i].x + 1 + Math.floor(Math.random() * (rooms[i].width - 1));
          var y = rooms[i].y + 1 + Math.floor(Math.random() * (rooms[i].height - 1));
          var num = Math.ceil(Math.random() * (currentFloorNum + 1));
          var lootType = Math.floor(Math.random() * 4);
          var item = void 0;
          switch (lootType) {
            case 0:
              item = new GoldPile(x, y, num);
              break;
            case 1:
              item = new Potion(x, y, 'red');
              break;
            case 2:
              item = new Potion(x, y, 'green');
              break;
            case 3:
              item = new Potion(x, y, 'blue');
              break;
          }

          item.setRoomNum(i);
          this.items.push(item);
        }
        // spawn enemies
        while (roomThreatLevel > 0) {
          var _x = rooms[i].x + 1 + Math.floor(Math.random() * (rooms[i].width - 1));
          var _y = rooms[i].y + 1 + Math.floor(Math.random() * (rooms[i].height - 1));
          var enemy = createRandomEnemy(0, roomThreatLevel);
          roomThreatLevel -= enemy.lvl;
          enemy.x = _x;enemy.y = _y;
          enemy.setRoomNum(i);
          this.enemies.push(enemy);
        }
      }
    }

    // changes the tiles to wall tiles

  }, {
    key: 'createWalls',
    value: function createWalls(rooms) {
      var thisFloor = this;
      rooms.forEach(function (room) {
        for (var i = room.y; i < room.y + room.height + 1; i++) {
          thisFloor.grid[room.x][i] = tileTypes.WALL;
          thisFloor.grid[room.x + room.width][i] = tileTypes.WALL;
        }
        for (var _i = room.x; _i < room.x + room.width + 1; _i++) {
          thisFloor.grid[_i][room.y] = tileTypes.WALL;
          thisFloor.grid[_i][room.y + room.height] = tileTypes.WALL;
        }
      });
    }

    // puts gaps in the walls

  }, {
    key: 'createDoors',
    value: function createDoors(root, horiz) {
      if (root.left && root.right) {
        this.addDoor(root, horiz);
        this.createDoors(root.left, !horiz);
        this.createDoors(root.right, !horiz);
      }
    }
  }, {
    key: 'addDoor',
    value: function addDoor(cell, horiz) {
      if (horiz) {
        var found = false;
        var tries = 0;
        while (!found && tries < 100) {
          var h = cell.left.y + Math.floor(Math.random() * (cell.left.height - 1));
          var w = cell.left.x + cell.left.width;
          // console.log("" + this.grid[w+1,h] + "," + this.grid[w,h] + "," + this.grid[w-1,h]);
          if (this.grid[w + 1][h] === tileTypes.FLOOR && this.grid[w - 1][h] === tileTypes.FLOOR) {
            // create door
            this.grid[w][h] = tileTypes.DOOR;
            found = true;
          }
          tries++;
        }
      } else {
        var _found = false;
        var _tries = 0;
        while (!_found && _tries < 100) {
          var _w = cell.left.x + Math.floor(Math.random() * (cell.left.width - 1));
          var _h = cell.left.y + cell.left.height;
          if (_w > 19) {
            // console.log(w);
          }
          if (this.grid[_w][_h + 1] === tileTypes.FLOOR && this.grid[_w][_h - 1] === tileTypes.FLOOR) {
            // create door
            this.grid[_w][_h] = tileTypes.DOOR;
            _found = true;
          }
          _tries++;
        }
      }
    }
  }, {
    key: 'openDoor',
    value: function openDoor(x, y) {
      if (this.grid[x][y] === tileTypes.DOOR) {
        this.rooms[getRoomIdxFromTile(x, y, this.rooms)].visible = true;
        this.rooms[getRoomIdxFromTile(x - 1, y - 1, this.rooms)].visible = true;
      }
    }
  }, {
    key: 'display',
    value: function display(ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // how big tiles normally look
      var tileSize = constants.tileSize;
      // tile size is proportional to the amount of space (what?)
      // let screenTileSize = Math.min(canvas.width/this.width, canvas.height/this.height);
      // scale the whole thing based on how many tiles can fit
      // let scale = screenTileSize / tileSize;
      // first move the grid so that the center is in the center
      ctx.save();
      // ctx.translate(-1*this.width*this.tileSize / 2, -1*this.height*this.tileSize / 2);
      // ctx.scale(scale, scale);

      // get floor reference for use in anonymous func
      var floor = this;

      // loop through rooms
      this.rooms.forEach(function (room) {
        // ctx.fillRect((room.x+1)*tileSize, (room.y+1)*tileSize, (room.width-1)*tileSize, (room.height-1)*tileSize);
        // only draw visible rooms
        if (room.visible) {
          // loop through room
          for (var i = 0; i < room.width + 1; i++) {
            for (var j = 0; j < room.height + 1; j++) {
              // ctx.fillStyle = tileColors[floor.grid[room.x+i][room.y+j]];
              var type = floor.grid[room.x + i][room.y + j];
              // ctx.fillRect((room.x+i)*tileSize,(room.y+j)*tileSize,tileSize,tileSize);
              ctx.drawImage(images.tileset, tileImgWidth * type, 0, 32, 32, (room.x + i) * tileSize, (room.y + j) * tileSize, tileSize, tileSize);
            }
          }
        }
      });
      // console.log(i*j);
      ctx.restore();
    }
  }]);

  return Floor;
}();

var Dungeon = function () {
  function Dungeon() {
    _classCallCheck(this, Dungeon);

    // list of tile maps
    this.floors = [];
  }

  _createClass(Dungeon, [{
    key: 'addFloor',
    value: function addFloor(w_, h_) {
      var f = new Floor(w_, h_);
      f.generate(); // procedurally create walls and doors
      this.floors.push(f);
    }
  }]);

  return Dungeon;
}();
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// functions for visual effects
var effectsManager = {
  hitMarkers: [],
  sparks: [],
  addHitMarker: function addHitMarker(num, pos, color, multiplier) {
    this.hitMarkers.push(new HitMarker(num, pos, 1000, color, multiplier));
  },
  addSpark: function addSpark(pos, color) {
    this.sparks.push(new Spark(pos, 1000, color));
  },
  updateAll: function updateAll() {
    for (var i = this.hitMarkers.length - 1; i > -1; i--) {
      if (this.hitMarkers[i].checkExpiry() === 'expired') {
        this.hitMarkers.splice(i, 1);
      }
    }
    for (var _i = this.sparks.length - 1; _i > -1; _i--) {
      if (this.sparks[_i].checkExpiry() === 'expired') {
        this.sparks.splice(_i, 1);
      }
    }
  },
  drawAll: function drawAll(ctx) {
    this.hitMarkers.forEach(function (hm) {
      hm.draw(ctx);
    });
    this.sparks.forEach(function (s) {
      s.draw(ctx);
    });
  }
};

var HitMarker = function () {
  function HitMarker(num, pos, lifetime, color, multiplier) {
    _classCallCheck(this, HitMarker);

    this.color = color || 'red';
    this.num = num;
    this.pos = pos;
    this.startTime = Date.now();
    this.lifetime = lifetime;
    this.offset = { x: Math.random() * 5, y: Math.random() * 10 };
    this.checkExpiry = function () {
      // console.log("killTime: "+(this.startTime + this.lifetime));
      // console.log("currentTime: "+Date.now());
      if (Date.now() > this.startTime + this.lifetime) return 'expired';
    };

    if (multiplier) {
      // bubble text
      this.txt = 'x' + this.num;
    } else {
      // bubble text
      this.txt = '-' + this.num;
      // check for whiff
      if (this.num === 0) this.txt = 'miss';
      // check for HP potion
      if (this.num < 0) {
        var posNum = -1 * this.num;
        this.txt = '+' + posNum;
      }
    }
  }

  _createClass(HitMarker, [{
    key: 'draw',
    value: function draw(ctx) {
      var percent = (this.startTime + this.lifetime - Date.now()) / this.lifetime;
      ctx.save();
      // fade out
      ctx.globalAlpha = percent;
      // background
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.pos.x + this.offset.x + percent * 5 + 7, this.pos.y + this.offset.y + percent * 5 - 5, 15, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fill();
      // red
      ctx.fillStyle = 'white';
      // draw and slowly drift away
      ctx.font = '12px Verdana';
      ctx.fillText(this.txt, this.pos.x + this.offset.x + percent * 5, this.pos.y + this.offset.y + percent * 5);
      // reset
      ctx.restore();
    }
  }]);

  return HitMarker;
}();

var Spark = function () {
  function Spark(pos, lifeTime, color) {
    _classCallCheck(this, Spark);

    this.pos = pos;
    this.startTime = Date.now();
    this.lifetime = lifeTime;

    if (color) {
      this.color = color;
    } else {
      this.color = '#55f';
    }
  }

  _createClass(Spark, [{
    key: 'checkExpiry',
    value: function checkExpiry() {
      // console.log("killTime: "+(this.startTime + this.lifetime));
      // console.log("currentTime: "+Date.now());
      if (Date.now() > this.startTime + this.lifetime) return 'expired';
    }
  }, {
    key: 'draw',
    value: function draw(ctx) {
      // percent of life
      var percent = (this.startTime + this.lifetime - Date.now()) / this.lifetime;

      // contain draw
      ctx.save();
      // fade out
      ctx.globalAlpha = percent;
      // color
      ctx.fillStyle = this.color;
      // pos
      ctx.translate(this.pos.x + percent * 5 + 7, this.pos.y + percent * 5 - 5);
      // rotate
      ctx.rotate(percent * 2 * Math.PI);
      // scale
      ctx.scale(1 + 2 * percent, 1 + 2 * percent);
      // draw 4 pointed star
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(5, 5);
      ctx.lineTo(15, 0);
      ctx.lineTo(5, -5);
      ctx.lineTo(0, -15);
      ctx.lineTo(-5, -5);
      ctx.lineTo(-15, 0);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      // fill
      ctx.fill();
      // reset context
      ctx.restore();
    }
  }]);

  return Spark;
}();
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// *** static functions ***
var createRandomEnemy = function createRandomEnemy(lvlMin, lvlMax) {
  lvlMin = lvlMin || 0;
  lvlMax = lvlMax || 1000000;
  var idxMin = lvlMin;
  var idxMax = lvlMax;
  /* for (let i=0; i<enemyTypes.length; i++) {
    if (enemyTypes[i].lvl > lvlMin) {
      idxMin = i;
    }
    if (enemyTypes[i].lvl < lvlMax) {
      idxMax = i;
    }
  }*/
  var a = idxMin + Math.floor(Math.random() * (idxMax - idxMin + 1));
  console.log('a: ' + a);
  return createEnemyByTypeIndex(a);
};

var createEnemyByTypeIndex = function createEnemyByTypeIndex(idx) {
  switch (idx) {
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
};

// *** ENEMY CLASSES ***

// base class

var Enemy = function (_Character) {
  _inherits(Enemy, _Character);

  function Enemy() {
    _classCallCheck(this, Enemy);

    // *** basic interactions ***
    var _this = _possibleConstructorReturn(this, (Enemy.__proto__ || Object.getPrototypeOf(Enemy)).call(this));
    // call parent constructor


    _this.awake = false; // sleeping until the player wakes it up

    // which room (relative to floor)
    _this.roomNum = -1;
    // setter
    _this.setRoomNum = function (num) {
      this.roomNum = num;
    };

    _this.path = [];
    return _this;
  }

  // overwrite this for more complex behaviors


  _createClass(Enemy, [{
    key: 'updateBehavior',
    value: function updateBehavior() {
      this.seekClosestPlayer();
    }

    // move towards closest player

  }, {
    key: 'seekClosestPlayer',
    value: function seekClosestPlayer() {
      // player to pursue
      var target = void 0;
      var playerAlreadyFoundInSameRoom = false;
      var room = currentFloor.rooms[getRoomIdxFromTile(currentFloor.rooms, this.x, this.y)];
      var minDist = 1000000;
      // reference to this enemy inside anon func
      var e = this;
      // players is a global var
      players.forEach(function (p) {
        // player is in the same room as enemy
        if (currentFloor.rooms[getRoomIdxFromTile(currentFloor.rooms, p.x, p.y)] === room) {
          if (!playerAlreadyFoundInSameRoom) {
            target = p;
            var distSq = (p.x - e.x) * (p.x - e.x) + (p.y - e.y) * (p.y - e.y);
            minDist = distSq;
            playerAlreadyFoundInSameRoom = true;
          } else {
            var _distSq = (p.x - e.x) * (p.x - e.x) + (p.y - e.y) * (p.y - e.y);
            if (_distSq < minDist) {
              minDist = _distSq;
              target = p;
            }
          }
        } else if (!playerAlreadyFoundInSameRoom) {
          var _distSq2 = (p.x - this.x) * (p.x - this.x) + (p.y - this.y) * (p.y - this.y);
          if (_distSq2 < minDist) {
            minDist = _distSq2;
            target = p;
          }
        }
      });

      // if there is no target, escape
      if (!target) return;

      // let map = nodeMap[currentFloorNum];
      /* let closestPointToPlayer
      this.path = Astar(
        map,
        map[this.x][this.y],
        map[target.x][target.y],
        dungeon.floors[currentFloorNum].width);
      */

      var dir = void 0;
      var vert = 0;
      var horiz = 0;
      if (this.x > target.x) {
        dir = 'LEFT';
        horiz = -1;
      } else if (this.x < target.x) {
        dir = 'RIGHT';
        horiz = 1;
      } else if (this.y < target.y) {
        dir = 'DOWN';
        vert = -1;
      } else if (this.y > target.y) {
        dir = 'UP';
        vert = +1;
      } else {
        // on top of player
      }
      var result = void 0;
      if (dir) {
        result = this.move(dir, dungeon.floors[currentFloorNum]);
      }
      if (result === 'wall') {
        /* for (let i=0; i<50; i++) {
          //currenFloor.grid[
        }*/
      }
    }
  }]);

  return Enemy;
}(Character);
// inherit from parent
// Enemy.prototype = Object.create(Character.prototype);
// Enemy.prototype.constructor = Enemy;

var ratImg = new Image();
ratImg.src = 'images/rat.png';
// rat class

var Rat = function (_Enemy) {
  _inherits(Rat, _Enemy);

  function Rat() {
    _classCallCheck(this, Rat);

    // image
    var _this2 = _possibleConstructorReturn(this, (Rat.__proto__ || Object.getPrototypeOf(Rat)).call(this));
    // call parent constructor


    _this2.image = ratImg;

    // *** enemy rpg attributes ***
    _this2.name = 'Rat';
    // threat level
    _this2.lvl = 1;
    // xp when killed
    _this2.xp = 1;
    // weapon
    _this2.weapon = weapons.stick; // start with a basic weapon
    // hp
    _this2.hp = 4;
    _this2.maxHp = 4;
    // strength
    _this2.strength = 4;
    // defense
    _this2.defense = 2; // dodge chance

    // draw with offset because the sprite is short
    _this2.offsetY = 10;
    return _this2;
  }

  _createClass(Rat, [{
    key: 'updateBehavior',
    value: function updateBehavior() {
      this.seekClosestPlayer();
    }
  }]);

  return Rat;
}(Enemy);
// inherit from parent
// Rat.prototype = Object.create(Enemy.prototype);
// Rat.prototype.constructor = Rat;


Rat.prototype.lvl = 1; // used by the createRandomEnemy func

var slimeImg = new Image();
slimeImg.src = 'images/slime.png';
// slime class

var Slime = function (_Enemy2) {
  _inherits(Slime, _Enemy2);

  function Slime() {
    _classCallCheck(this, Slime);

    // image
    var _this3 = _possibleConstructorReturn(this, (Slime.__proto__ || Object.getPrototypeOf(Slime)).call(this));
    // call parent constructor


    _this3.image = slimeImg;

    // *** enemy rpg attributes ***
    _this3.name = 'Green Slime';
    // threat level
    _this3.lvl = 2;
    // xp when killed
    _this3.xp = 3;
    // weapon
    _this3.weapon = weapons.stick; // start with a basic weapon
    // hp
    _this3.hp = 10;
    _this3.maxHp = 10;
    // strength
    _this3.strength = 8;
    // defense
    _this3.defense = 2; // dodge chance

    // draw with offset because the sprite is short
    _this3.offsetY = 10;
    return _this3;
  }

  _createClass(Slime, [{
    key: 'updateBehavior',
    value: function updateBehavior() {
      this.seekClosestPlayer();
    }
  }]);

  return Slime;
}(Enemy);
// inherit from parent
// Slime.prototype = Object.create(Enemy.prototype);
// Slime.prototype.constructor = Slime;


Slime.prototype.lvl = 2; // used by the createRandomEnemy func

// list of the types of enemies
var enemyTypes = [Rat, Slime];
'use strict';

// *** GAME SCRIPT ***

// canvas elem
var canvas = void 0;
var ctx = void 0;
// the dungeon object
var dungeon = void 0;
// the spawn point on the current floor
var spawn = { x: 0, y: 0 };
// the lowest floor the player has been to
var bottomFloorNum = -1;
// the current floor index
var currentFloorNum = -1;
// floor reference
var currentFloor = void 0;
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
var offline = window.location.toString()[0] === 'f';
console.log(offline);
var gridDimensions = { x: 18, y: 12 };

// initialize variables
var init = function init() {
  canvas = document.querySelector('canvas');
  document.querySelector('#fullscreenBtn').onclick = fullScreen;
  canvas.onclick = fullScreen;
  ctx = canvas.getContext('2d');

  dungeon = new Dungeon();
  startGame();
};
window.addEventListener('load', init);

var fullScreen = function fullScreen() {
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
};

var startGame = function startGame() {
  // start the timer
  gameTime = startTime = Date.now();

  // enter a dungeon
  goToFloor(0);

  // if off-line create a character and activate keyboard controls
  if (offline) activateOfflineCharacter();

  gameLoop();
};

var activateOfflineCharacter = function activateOfflineCharacter() {
  addPlayer('offline');
  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey) {
      // go down stairs
      handlePlayerInput('{ "name": "offline", "btn": "use [stairs]" }');
    }
  });
  window.addEventListener('keypress', function (e) {
    console.log(e.keyCode);
    switch (e.keyCode) {
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
};

// every tick
var gameLoop = function gameLoop() {
  // console.log("lop");
  gameTime = skippedTime + Date.now() - startTime;
  if (gameTime - turnCount * turnInterval > turnInterval) {
    turnCount++;
    update();
  }
  draw();
  // window.setTimeout(gameLoop,250);
  window.requestAnimationFrame(gameLoop);
};

// modify turn-based game values
var update = function update() {
  currentFloor.enemies.forEach(function (enemy) {
    if (currentFloor.rooms[enemy.roomNum].visible) {
      enemy.updateBehavior();
    }
  });
  players.forEach(function (player) {
    player.actionsLeft = 1;
    // send(player.name,"Your turn. Health: "+(player.hp/player.maxHp)); // send the controller an update
    // send(player.name,"Your turn "+Date.now()); // send the controller an update
    // player.x = player.futurePos.x;
    // player.y = player.futurePos.y;
  });
};

// draw to the screen
var draw = function draw() {
  // reset transform (scale 3)
  var gScale = 2;
  ctx.setTransform(gScale, 0, 0, gScale, 0, gScale);
  // draw floor
  currentFloor.display(ctx);

  // asfdasdfasfd
  var index = 0;
  // draw players
  players.forEach(function (player) {
    index++;
    if (player.visible) {
      player.draw(ctx);
    }
    if (player.actionsLeft === 0) {
      console.log(player.actionsLeft);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      console.log(i);
      // ctx.arc(100,100,30,0,2*Math.PI,true);
      ctx.arc(canvas.width / 2 - 40, 10 + 15 * index, 10, 0, 2 * Math.PI, true);
      // ctx.arc(canvas.width - 40,20+20*i,10,0,2*Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.fillText('P' + index, canvas.width / 2 - 46, 14 + 15 * index);
    }
  });
  // draw enemies
  currentFloor.enemies.forEach(function (enemy) {
    if (currentFloor.rooms[enemy.roomNum].visible) {
      enemy.draw(ctx);
    }
  });
  currentFloor.items.forEach(function (item) {
    if (currentFloor.rooms[item.roomNum].visible) {
      item.draw(ctx);
    }
  });
  // draw the effects
  effectsManager.updateAll();
  effectsManager.drawAll(ctx);
  // draw the "timer" indicator
  // drawTimer(ctx,{x: 600, y: 50},gameTime%turnInterval/turnInterval);
};

// generate a new dungeon floor
// or go back to a previous one
var goToFloor = function goToFloor(level) {
  // error checking
  if (!level || level < 0) level = 0;

  // set floor
  currentFloorNum = level;

  // if up
  if (level <= bottomFloorNum) {}
  // load floors[level]

  // if down
  else {
      // bottom is deeper
      bottomFloorNum++;
      // generate new floor
      dungeon.addFloor(gridDimensions.x, gridDimensions.y);
      /* nodeMap.length
      // create nodes
      let map = [];
      // create a grid with [width] columns
      for (let i=0; i<currentFloor.width; i++) {
        let col = [];
        // create a column with [height] tiles
        for (let j=0; j<currentFloor.height; j++) {
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
};

// deals with controller inputs
var handlePlayerInput = function handlePlayerInput(msg) {
  console.log('input: ' + msg);
  var inputData = JSON.parse(msg);
  var p = getPlayer(inputData.name);
  if (!p) p = addPlayer(inputData.name);
  if (inputData.btn.indexOf('THROW') >= 0) {
    // extract direction (after THROW_)
    var direction = inputData.btn.substring(6, inputData.btn.length);
    // throw the item
    p.throwItem(inputData.item, direction);
  } else if (inputData.btn.indexOf('drink') >= 0) {
    // drink the potion
    p.drinkPotion(inputData.item);
  } else {
    p.move(inputData.btn, currentFloor);
  }
  checkForAllReady();
};

// chech that all players have no moves left
var checkForAllReady = function checkForAllReady() {
  var done = true;
  players.forEach(function (player) {
    if (player.actionsLeft > 0) done = false;
  });
  // if done, skip to turn end
  if (done) {
    // shorthand
    var _gameTime = skippedTime + Date.now() - startTime;
    // skip ahead to next turn
    skippedTime += turnInterval - (_gameTime - turnCount * turnInterval);
  }
};

// retrieves a player with a given name
var getPlayer = function getPlayer(name) {
  for (var _i = 0; _i < players.length; _i++) {
    if (players[_i].name === name) {
      return players[_i];
    }
  }
};

// add a new player
var addPlayer = function addPlayer(name, type) {
  if (getPlayer(name)) return;
  console.log('added ' + name);
  var newb = new Player(name, type);
  newb.x = spawn.x;
  newb.y = spawn.y;
  newb.prevPos.x = spawn.x;
  newb.prevPos.y = spawn.y;
  players.push(newb);
  return newb;
  console.log(players);
};

// draw the turn timer
var drawTimer = function drawTimer(ctx, pos, percent) {
  ctx.save();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 30, 0, 2 * Math.PI * percent, true);
  ctx.lineTo(pos.x, pos.y);
  ctx.closePath();
  ctx.globalAlpha = 0.1;
  ctx.fill();
  ctx.restore();
};
'use strict';

var output = void 0;
var gameSocket = void 0;

var setupGameSocketIO = function setupGameSocketIO() {
  gameSocket = io();
  gameSocket.emit('assert game', 'I am the game host');

  // handles player input, global func in game.js
  gameSocket.on('output', function (msg) {
    handlePlayerInput(msg);
  });

  gameSocket.on('add player', function (msg) {
    // new player
    var o = JSON.parse(msg);
    // add and track avatar
    addPlayer(o.name, o.type);
  });
  gameSocket.on('key', function (msg) {
    document.querySelector('.follow').innerHTML = document.querySelector('.follow').innerHTML + '<br>room key: ' + msg;
  });
};

var initSocket = function initSocket() {
  if (!offline) setupGameSocketIO();
  output = document.getElementById('resultsInner');
  console.log('Ready to begin');
};
var send = function send(recipientName, msg) {
  if (offline) return;
  var json = '{ "name": "' + recipientName + '", "message": "' + msg + '"}';
  gameSocket.emit('feedback', json);
};

window.addEventListener('load', initSocket);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// *** ITEM CLASSES ***

var weapons = {
  stick: {
    name: 'stick',
    power: 1
  },
  broomhandle: {
    name: 'broomhandle',
    power: 2
  }
};

// which color does what? randomized at start
var potionTypes = {
  'red potion': 'health potion',
  'green potion': 'strength potion',
  'blue potion': 'lightning potion'
};

// possible potion effects
var potionEffectsList = ['healing potion', 'strength potion', 'lightning potion'];

// Item base class

var Item = function (_GameObject) {
  _inherits(Item, _GameObject);

  function Item(x, y, name) {
    _classCallCheck(this, Item);

    // GameObject.call(this,x,y);
    var _this = _possibleConstructorReturn(this, (Item.__proto__ || Object.getPrototypeOf(Item)).call(this, x, y));

    _this.name = name || 'no name';
    _this.roomNum = -1;
    _this.image = undefined;
    return _this;
  }

  _createClass(Item, [{
    key: 'setRoomNum',
    value: function setRoomNum(num) {
      this.roomNum = num;
    }
  }, {
    key: 'draw',
    value: function draw() {
      ctx.drawImage(this.image, this.x * constants.tileSize, this.y * constants.tileSize);
    }
  }, {
    key: 'removeFromFloor',
    value: function removeFromFloor() {
      this.roomNum = -1;
      currentFloor.items.splice(currentFloor.items.indexOf(this), 1);
    }
  }]);

  return Item;
}(GameObject);
// inherit from parent
// Item.prototype = Object.create(GameObject.prototype);
// Item.prototype.constructor = Item;

// the standard constructor for a gold pile


var GoldPile = function (_Item) {
  _inherits(GoldPile, _Item);

  function GoldPile(x_, y_, num_) {
    _classCallCheck(this, GoldPile);

    var _this2 = _possibleConstructorReturn(this, (GoldPile.__proto__ || Object.getPrototypeOf(GoldPile)).call(this, x_, y_, 'gold'));

    _this2.num = num_;
    _this2.image = new Image();
    _this2.image.src = 'images/Gold.png';
    return _this2;
  }

  return GoldPile;
}(Item);
// inherit from parent
// GoldPile.prototype = Object.create(Item.prototype);
// GoldPile.prototype.constructor = GoldPile;

// a magical potion of wonders


var Potion = function (_Item2) {
  _inherits(Potion, _Item2);

  function Potion(x_, y_, type_) {
    _classCallCheck(this, Potion);

    var _this3 = _possibleConstructorReturn(this, (Potion.__proto__ || Object.getPrototypeOf(Potion)).call(this, x_, y_, (type_ || 'red') + ' potion'));

    _this3.type = type_ || 'red';
    _this3.image = new Image();
    _this3.image.src = 'images/' + _this3.type + 'potion.png';
    return _this3;
  }

  return Potion;
}(Item);
// inherit from parent
// Potion.prototype = Object.create(Item.prototype);
// Potion.prototype.constructor = Potion;
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Node = function Node(x, y) {
  _classCallCheck(this, Node);

  this.x = x;
  this.y = y;
  this.gScore = 0;
  this.fScore = 0;
  this.cameFrom = undefined;
};

/*
function Astar(nodes, start, goal, width) {
    // The set of nodes already evaluated.
    var closedSet = [];
    // The set of currently discovered nodes still to be evaluated.
    // Initially, only the start node is known.
    var openSet = [start];
    // For each node, which node it can most efficiently be reached from.
    // If a node can be reached from many nodes, cameFrom will eventually contain the
    // most efficient previous step.
    var cameFrom = start; // the empty map

    // For each node, the cost of getting from the start node to that node.
    var gScore = 1000000000; // map with default value of Infinity
    // The cost of going from start to start is zero.
    gScore[start] = 0;
    // For each node, the total cost of getting from the start node to the goal
    // by passing by that node. That value is partly known, partly heuristic.
    var fScore = 1000000000; // map with default value of Infinity
    // For the first node, that value is completely heuristic.
    fScore[start] = 0; // heuristic_cost_estimate(start, goal);

    while (openSet.length != 0) {
    var current = start;
    // find the node in openSet having the lowest fScore[] value
    for (var i=0; i<openSet.length; i++) {
      if (openSet[i].fScore < current.fScore)
        current = openSet[i];
    }
    // made it!
        if (current === goal)
            return reconstruct_path(current)

        openSet.splice(openSet.indexOf(current),1);
        closedSet.push(current);
        for (var i=0; i<4; i++) { // for each neighbor of current
      var neighbor;
      switch(i) {
        case 0:
          neighbor = nodes[current.x-1][current.y];
          break;
        case 1:
          neighbor = nodes[current.x][current.y-1];
          break;
        case 2:
          neighbor = nodes[current.x+1][current.y];
          break;
        case 3:
          neighbor = nodes[current.x][current.y+1];
          break;
      }
      if (neighbor === undefined) continue;
      if (dungeon.floors[currentFloorNum].grid[neighbor.x][neighbor.y] === tileTypes.WALL) continue;
            if (closedSet.indexOf(neighbor) > -1)
                continue;    // Ignore the neighbor which is already evaluated.
            // The distance from start to a neighbor
            var tentative_gScore = current.gScore + dist_between(current, neighbor);
            if (openSet.indexOf(neighbor) === -1) {  // Discover a new node
        console.log(neighbor);
        debugger;
                openSet.push(neighbor);
      }
            else if (tentative_gScore >= neighbor.gScore)
                continue;    // This is not a better path.

            // This path is the best until now. Record it!
      neighbor.cameFrom = current;
            neighbor.gScore = tentative_gScore;
            neighbor.fScore = neighbor.gScore + heuristic_cost_estimate(neighbor, goal);
    }
  }
    return false;
}
*/
/*
const dist_between = (a,b) => {
  // if they are neighbors then the dist is 1
  return 1;
  //return Math.sqrt((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y));
}

const heuristic_cost_estimate = (a,b) => {
  return Math.sqrt((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y));
}

const reconstruct_path = (current) => {
    total_path = [current];
    while (current.cameFrom != undefined) {
        current = current.cameFrom;
        total_path.push(current);
    }
    return total_path;
}
*/
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// *** global scope character data ***

// how much xp is needed to reach this level
var xpRequirements = [5, 15, 30, 50, 75, 100];
// store all possible images
var characterImages = [];
// load all the images
var createDwarfImg = function createDwarfImg(i) {
  var img = new Image();
  img.src = 'images/dwarf' + i + '.png';
  characterImages.push(img);
};
window.addEventListener('load', function () {
  for (var i = 1; i < 7; i++) {
    createDwarfImg(i);
  }
});

// *** PLAYER CLASS ***

var Player = function (_Character) {
  _inherits(Player, _Character);

  function Player(name_, type_) {
    _classCallCheck(this, Player);

    // *** character rpg attributes ***
    // name
    var _this = _possibleConstructorReturn(this, (Player.__proto__ || Object.getPrototypeOf(Player)).call(this, name_));
    // call parent constructor


    _this.name = name_ || 'unnamed';
    // lvl
    _this.lvl = 1;
    // xp
    _this.xp = 0;
    // hp
    _this.maxHp = 15;
    _this.hp = 15;
    // strength
    _this.strength = 4;
    // intelligence
    _this.intelligence = 1;
    // defense
    _this.defense = 2; // dodge chance


    // define as player
    _this.isPlayer = true;
    // class (type)
    _this.type = type_ || 'Strong Murderhobo';
    // weapon
    _this.weapon = weapons.stick;
    // differentiate characters
    _this.color = Math.floor(Math.random() * 5);
    _this.image = characterImages[_this.color];
    _this.inventory = [];
    // drawing
    _this.visible = true;
    return _this;
  }

  _createClass(Player, [{
    key: 'dodge',
    value: function dodge(attackerdefense) {
      return Math.random() < this.defense / (this.defense + attackerdefense * 10);
    }

    // add xp for

  }, {
    key: 'addXp',
    value: function addXp(val) {
      this.xp += val;
      this.checkForLvlUp();
    }

    // check to see if the player has enough xp

  }, {
    key: 'checkForLvlUp',
    value: function checkForLvlUp() {
      if (this.lvl < this.xp - xpRequirements[this.lvl - 1]) {
        // level up!!!
        this.lvl++;
        this.hp += Math.ceil(this.hp / (this.maxHp + 10));
        this.maxHp += 10;
        this.strength += 2;
        this.defense += 2;
        this.intelligence += 2;
        // this.hp = this.maxHp; mwahaha, no more free hp for you
      }
    }

    // throw an item (currently limited to potions)

  }, {
    key: 'throwItem',
    value: function throwItem(itemName, direction) {
      // debug
      console.log('throwing ' + itemName + ' ' + direction);
      // remove from inventory
      var item = this.inventory.splice(this.inventory.indexOf(itemName), 1);
      // find out where the potion will land
      var landingSpot = this.getProjection(direction);
      // which effect?
      var effect = potionTypes[itemName];
      // apply effect based on what the item hits
      var target = gameTools.checkForEnemy(landingSpot.x, landingSpot.y);
      // if the target exists and so does the effect
      if (target && effect) {
        target.applyEffect(effect, this);
      } else if (effect === 'lightning potion') {
        powers.lightningBurst(this, landingSpot.x, landingSpot.y);
      }
    }

    // apply a potion's effect to the player

  }, {
    key: 'drinkPotion',
    value: function drinkPotion(itemName) {
      // debug
      console.log('drinking ' + itemName);

      // remove from inventory
      var item = this.inventory.splice(this.inventory.indexOf(itemName), 1);
      // check valid
      if (!item) {
        return;
      }
      // which effect?
      var effect = potionTypes[itemName];
      // apply
      if (effect) this.applyEffect(effect, this);
    }
  }, {
    key: 'checkAndResolveCollision',
    value: function checkAndResolveCollision(x, y) {
      // look for enemy
      var target = gameTools.checkForEnemy(x, y);
      // attack
      if (target) {
        this.attack(target);
        return true;
      }

      // look for loot
      target = gameTools.checkForItem(x, y);
      if (target) {
        // if potion, use immediately
        if (target.name.indexOf("potion" > -1)) {
          this.drinkPotion(target.name);
        } else {
          var msg = 'ITEM GET: ' + target.name;
          if (target.name === 'gold') {
            this.gold += target.num;
            msg += ' ' + target.num;
          } else {
            this.inventory.push(target);
          }
          // update the controller inventory
          send(this.name, msg);
        }
        // remove from floor
        target.removeFromFloor();
        return true;
      }
    }
  }, {
    key: 'hitWall',
    value: function hitWall() {
      // message phone
      send(this.name, 'you hit a wall');
    }
  }, {
    key: 'death',
    value: function death() {
      // kill
      console.log('you died');
      send(this.name, 'you died');
      // this.reset();
      this.gold = 0;
      // respawn
      this.x = spawn.x;
      this.y = spawn.y;
      this.hp = this.maxHp;
    }
  }, {
    key: 'reset',
    value: function reset() {
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
  }]);

  return Player;
}(Character);
// inheritance
// Player.prototype = Object.create(Character.prototype);
// Player.prototype.constructor = Player;
'use strict';

// utility consts

var getRandomArrayIndex = function getRandomArrayIndex(array, padding) {
  var pad = padding || 0;
  return pad + Math.floor(Math.random() * (array.length - pad));
};

var getRandomArrayElem = function getRandomArrayElem(array, padding) {
  array[getRandomArrayIndex(array, padding)];
};

// shortcut for document.querySelector
var getByClass = function getByClass(className) {
  document.querySelector('.' + className);
};

// shortcut for document.querySelector
var getById = function getById(id) {
  document.getElementById(id);
};

// checks to see if an element has a class
var hasClass = function hasClass(ele, cls) {
  !!ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
};

// adds a class to an element
var addClass = function addClass(ele, cls) {
  if (!hasClass(ele, cls)) ele.className += ' ' + cls;
};

// removes a class from an element
var removeClass = function removeClass(ele, cls) {
  if (hasClass(ele, cls)) {
    var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
    ele.className = ele.className.replace(reg, ' ');
  }
};

// shorthand for querySelector
var q = function q(str) {
  document.querySelector(str);
};
