// foundational and base classes as well as misc.

// game object base class
class GameObject {
  constructor(x_, y_) {
    this.x = x_ || 1;
    this.y = y_ || 1;
  }
}

// *** CHARACTER BASE CLASS ***
class Character extends GameObject {
  constructor(name) {
    // call parent constructor
    super();

    // *** RPG ATTRIBUTES ***
    // name
    this.name = name || 'unnamed';
    // lvl
    this.lvl = 1;
    // xp
    this.xp = 1;
    // hp
    this.maxHp = 1;
    this.hp = 1;
    // strength
    this.strength = 1;
    // defense
    this.defense = 1; // dodge chance
    this.dodge = function (attackerdefense) {
      return Math.random() < this.defense / (this.defense + attackerdefense * 10);
    };
    this.zapped = false;

    // *** CHARACTER UTILITY ***
    // player only boolean
    this.isPlayer = false;
    // don't allow player input if the player has already acted this turn
    this.actionsLeft = 1;
    // store player input here until it can be used
    this.futurePos = { x: this.x, y: this.y };

    // *** DRAWING AND ANIMATION ***
    // base sprite
    this.image = undefined;
    // offset for drawing
    this.offsetX = 0;
    this.offsetY = 0;
    // when hit by an attack
    this.shakingTimer = 0; // not implemented
    // when attacking
    this.attackDirection = 0; // not implemented
    this.attackDirection = -1; // directions 0 to 3
    // moving
    this.prevPos = { x: 0, y: 0 };
    this.moveTransitionStart = 0;
    this.moveTransitionDuration = 100;
  }

  // *** METHODS ***
  // move one space given a direction and grid info
  move(dir, floor) {
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
        players.forEach(p => {
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
        players.forEach(p => {
          p.x = currentFloor.stairsPos.x;
          p.y = currentFloor.stairsPos.y;
          p.visible = true;
        });
      }
      return;
    }

    // don't let invisible characters walk around
    if (this.visible === false) return;

    const projection = this.getProjection(dir);

    // moving is an attack if the space is occupied
    const collisionOccured = this.checkAndResolveCollision(projection.x, projection.y);
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

  getProjection(dir) {
    const projection = { x: this.x, y: this.y };
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

  checkAndResolveCollision(x, y) {
    // get target of the appropriate type
    const target = gameTools.checkForOpponent(this.isPlayer, x, y);
    // attack
    if (target) {
      this.attack(target);
      return true;
    }
  }

  damage(num, xpCallback) {
    this.hp -= num;
    if (this.hp > this.maxHp) {
      this.hp = this.maxHp;
    }
    if (this.hp <= 0) {
      console.log(`${this.name} ded`);
      // if there is an xpCallback
      if (xpCallback) xpCallback(this.xp);
      if (!this.isPlayer) {
        currentFloor.enemies.splice(currentFloor.enemies.indexOf(this), 1);
      }
      // if there exists a death function
      if (this.death) this.death();
    }
    const color = this.isPlayer ? 'blue' : 'red';
    effectsManager.addHitMarker(num, { x: this.x * constants.tileSize, y: this.y * constants.tileSize }, color);
  }

  // attack target
  attack(target) {
    // if the target is invalid, escape
    if (target.hp === undefined) return;
    // roll for dodge
    if (target.dodge(this.defense)) {
      target.damage(0);
      return;
    }
    // check for weapon
    const power = this.weapon ? this.strength + this.weapon.power : this.strength;
    // roll for damage
    const damage = Math.ceil(power / 2 + Math.random() * power / 2);
    // deal damage
    const ref = this;
    target.damage(damage, val => {
      if (ref.addXp) ref.addXp(val);
    });
  }

  // draw on the screen
  draw(ctx) {
    ctx.save();

    // transition percent
    const p = Math.min(1, (Date.now() - this.moveTransitionStart) / this.moveTransitionDuration);

    // where to draw
    const drawPosX = this.x * constants.tileSize * p + this.prevPos.x * constants.tileSize * (1 - p) + this.offsetX;
    const drawPosY = this.y * constants.tileSize * p + this.prevPos.y * constants.tileSize * (1 - p) + this.offsetY;

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
    ctx.fillText(`${this.name} Lvl.${this.lvl}`, drawPosX, drawPosY - 2);

    // restore
    ctx.restore();
  }

  applyEffect(effectName, origin) {
    // debug
    console.log(`potion effect: ${effectName}`);

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
        this.damage(-20, () => {});
        break;
    }
  }

  // damage all of the spaces around a character (chain reaction)
  // origin is the character that started the lightning chain
  lightningBurst(origin) {
    // visual
    const pos = { x: this.x * constants.tileSize, y: this.y * constants.tileSize };
    // debug
    console.log(`${this.name} is zapping everything`);
    for (let x = -1; x < 2; x++) {
      for (let y = -1; y < 2; y++) {
        effectsManager.addSpark({ x: pos.x + x * constants.tileSize, y: pos.y + y * constants.tileSize });
        const target = gameTools.checkForEnemy(this.x + x, this.y + y);
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
  temporaryStatBoost(func, amount, duration) {
    // change stat
    func(this, amount);
    // reference to self
    const self = this;
    // if duration <= 0 the effect is permanent
    if (duration > 0) {
      // apply the opposite effect in time = duration
      window.setTimeout(() => {
        self.temporaryStatBoost(func, -1 * amount, -1);
      }, duration);
    }
  }

  // strength boost or nerf
  addStrength(target, amount) {
    const color = '#3a5';
    effectsManager.addHitMarker(-1 * amount, { x: target.x * constants.tileSize, y: target.y * constants.tileSize }, color);
    target.strength += amount;
  }

  // defense boost or nerf
  addDefense(target, amount) {
    const color = 'yellow';
    effectsManager.addHitMarker(amount, { x: target.x * constants.tileSize, y: target.y * constants.tileSize }, color);
    target.defense += amount;
  }
}
// inheritance
// Character.prototype = Object.create(GameObject.prototype);
// Character.prototype.constructor = Character;

// container for helper functions
const gameTools = {
  checkForOpponent(isPlayer, x, y) {
    if (isPlayer) {
      return gameTools.checkForEnemy(x, y);
    }
    return gameTools.checkForPlayer(x, y);
  },

  checkForPlayer(x, y) {
    for (let i = 0; i < players.length; i++) {
      if (players[i].x === x && players[i].y === y) {
        return players[i];
      }
    }
  },
  checkForEnemy(x, y) {
    for (let i = 0; i < currentFloor.enemies.length; i++) {
      if (currentFloor.enemies[i].x === x && currentFloor.enemies[i].y === y) {
        return currentFloor.enemies[i];
      }
    }
  },
  checkForItem(x, y) {
    for (let i = 0; i < currentFloor.items.length; i++) {
      if (currentFloor.items[i].x === x && currentFloor.items[i].y === y) {
        return currentFloor.items[i];
      }
    }
  }
};

// container for powers
const powers = {
  lightningBurst(originPlayer, xStart, yStart) {
    const pos = { x: xStart * constants.tileSize, y: yStart * constants.tileSize };
    effectsManager.addSpark(pos);
    for (let x = -1; x < 2; x++) {
      for (let y = -1; y < 2; y++) {
        const target = gameTools.checkForEnemy(xStart + x, yStart + y);
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
const constants = {
  tileSize: 32,
  // js enum for directions
  directions: { LEFT: 0, UP: 1, RIGHT: 2, DOWN: 3 },
  // fire damage
  lightningDamage: 10
};
Object.freeze(constants);
// *** THE DUNGEON ***

const tileTypes = { FLOOR: 0, WALL: 1, DOOR: 2, WATER: 3, STAIRS_DOWN: 4, STAIRS_UP: 5 };
Object.freeze(tileTypes);
// const tileColors = ['grey', 'red', 'yellow', 'blue'];
const images = {
  tileset: undefined
};
images.tileset = new Image();
images.tileset.src = 'images/rothens_tiles_2.png';
const tileImgWidth = 32;
const minRoomDimension = 5;

// partition class
class Partition {
  constructor(x, y, width, height) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 0;
    this.height = height || 0;

    this.left = undefined;
    this.right = undefined;
  }
}

// try to create children partitions all the way down
const SubdivideRecursively = (cell, horiz, min, random) => {
  const children = Subdivide(cell, horiz, min);
  if (children != undefined) {
    cell.left = children[0];
    cell.right = children[1];
    let o1 = 0;
    let o2 = 0;
    if (random) {
      r1 = Math.floor(Math.random() * 4);
      r2 = Math.floor(Math.random() * 4);
      if (r1 > 1) o1 = r1;
      if (r2 > 1) o2 = r2;
    }
    SubdivideRecursively(cell.left, !horiz, min + o1);
    SubdivideRecursively(cell.right, !horiz, min + o2);
  }
  return cell;
};

// create children partitions of this cell
const Subdivide = (cell, horiz, min) => {
  if (horiz && cell.width < min || !horiz && cell.height < min) {
    // console.log("could not divide");
    return;
  }
  const children = [];
  if (horiz) {
    const div = 3 + Math.ceil(Math.random() * (cell.width - 6));
    // console.log("divided horizontally at "+div);
    children[0] = new Partition(cell.x, cell.y, div, cell.height);
    children[1] = new Partition(cell.x + div, cell.y, cell.width - div, cell.height);
  } else {
    const div = 3 + Math.ceil(Math.random() * (cell.height - 6));
    // console.log("divided vertically at "+div);
    children[0] = new Partition(cell.x, cell.y, cell.width, div);
    children[1] = new Partition(cell.x, cell.y + div, cell.width, cell.height - div);
  }
  return children;
};

// get teh leaf nodes
// (root)
const listRooms = rootPartition => {
  const rooms = [];
  traverseTree(rooms, rootPartition);
  return rooms;
};

// recurse and add the the list when you hit bottom
const traverseTree = (list, node) => {
  if (node.left === undefined && node.right === undefined) {
    list.push(node);
  } else {
    if (node.left !== undefined) traverseTree(list, node.left);
    if (node.right !== undefined) traverseTree(list, node.right);
  }
};

// given coordinates, find which room contains those coordinates
const getRoomIdxFromTile = (x, y, rooms) => {
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].x <= x && x < rooms[i].x + rooms[i].width) {
      if (rooms[i].y <= y && y < rooms[i].y + rooms[i].height) {
        return i;
      }
    }
  }
};

// a floor object (tile map)
class Floor {
  constructor(w_, h_) {
    this.width = w_;
    this.height = h_;
    // tile representation
    this.grid = [];
    // enemies
    // list of enemies
    this.enemies = [];
    // create a grid with [width] columns
    for (let i = 0; i < w_; i++) {
      const col = [];
      // create a column with [height] tiles
      for (let j = 0; j < h_; j++) {
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
  generate() {
    // create the root
    const root = new Partition();
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
    this.rooms.forEach(room => {
      room.visible = false;
    });

    // add walls
    this.createWalls(this.rooms);

    // add doors
    this.createDoors(this.root, true);

    // create down stairs
    const endNum = Math.floor(Math.random() * (this.rooms.length - 1));
    // if (endNum >= startNum) endNum++; // don't end in the same room as start
    const dsx = this.rooms[endNum].x + Math.floor(this.rooms[endNum].width / 2);
    const dsy = this.rooms[endNum].y + Math.floor(this.rooms[endNum].height / 2);
    this.grid[dsx][dsy] = tileTypes.STAIRS_DOWN;
    this.stairsPos = { x: dsx, y: dsy };

    // start in random room
    let startNum = Math.floor(Math.random() * this.rooms.length);
    // random room that is not the same as the end room
    for (let l = 0; l < 100; l++) {
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

  populateRooms(rooms, startRoomNum) {
    for (let i = 0; i < rooms.length; i++) {
      if (i === startRoomNum) continue;
      // decide how many and how powerful enemies in this room could potentially be
      let roomThreatLevel = Math.ceil(currentFloorNum * (rooms[i].width * rooms[i].height / 200.0) * (players.length + 1)); // 1 to 4 inclusive + floorNum
      console.log(`room${i} threat level: ${roomThreatLevel}`);
      // decide how many pieces of loot in this room
      const lootHere = Math.random() * rooms[i].width * rooms[i].height / 5.0;
      // place loot
      for (let j = 0; j < Math.floor(lootHere); j++) {
        const x = rooms[i].x + 1 + Math.floor(Math.random() * (rooms[i].width - 1));
        const y = rooms[i].y + 1 + Math.floor(Math.random() * (rooms[i].height - 1));
        const num = Math.ceil(Math.random() * (currentFloorNum + 1));
        const lootType = Math.floor(Math.random() * 4);
        let item;
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
        const x = rooms[i].x + 1 + Math.floor(Math.random() * (rooms[i].width - 1));
        const y = rooms[i].y + 1 + Math.floor(Math.random() * (rooms[i].height - 1));
        const enemy = createRandomEnemy(0, roomThreatLevel);
        roomThreatLevel -= enemy.lvl;
        enemy.x = x;enemy.y = y;
        enemy.setRoomNum(i);
        this.enemies.push(enemy);
      }
    }
  }

  // changes the tiles to wall tiles
  createWalls(rooms) {
    const thisFloor = this;
    rooms.forEach(room => {
      for (let i = room.y; i < room.y + room.height + 1; i++) {
        thisFloor.grid[room.x][i] = tileTypes.WALL;
        thisFloor.grid[room.x + room.width][i] = tileTypes.WALL;
      }
      for (let i = room.x; i < room.x + room.width + 1; i++) {
        thisFloor.grid[i][room.y] = tileTypes.WALL;
        thisFloor.grid[i][room.y + room.height] = tileTypes.WALL;
      }
    });
  }

  // puts gaps in the walls
  createDoors(root, horiz) {
    if (root.left && root.right) {
      this.addDoor(root, horiz);
      this.createDoors(root.left, !horiz);
      this.createDoors(root.right, !horiz);
    }
  }

  addDoor(cell, horiz) {
    if (horiz) {
      let found = false;
      let tries = 0;
      while (!found && tries < 100) {
        const h = cell.left.y + Math.floor(Math.random() * (cell.left.height - 1));
        const w = cell.left.x + cell.left.width;
        // console.log("" + this.grid[w+1,h] + "," + this.grid[w,h] + "," + this.grid[w-1,h]);
        if (this.grid[w + 1][h] === tileTypes.FLOOR && this.grid[w - 1][h] === tileTypes.FLOOR) {
          // create door
          this.grid[w][h] = tileTypes.DOOR;
          found = true;
        }
        tries++;
      }
    } else {
      let found = false;
      let tries = 0;
      while (!found && tries < 100) {
        const w = cell.left.x + Math.floor(Math.random() * (cell.left.width - 1));
        const h = cell.left.y + cell.left.height;
        if (w > 19) {
          // console.log(w);
        }
        if (this.grid[w][h + 1] === tileTypes.FLOOR && this.grid[w][h - 1] === tileTypes.FLOOR) {
          // create door
          this.grid[w][h] = tileTypes.DOOR;
          found = true;
        }
        tries++;
      }
    }
  }

  openDoor(x, y) {
    if (this.grid[x][y] === tileTypes.DOOR) {
      this.rooms[getRoomIdxFromTile(x, y, this.rooms)].visible = true;
      this.rooms[getRoomIdxFromTile(x - 1, y - 1, this.rooms)].visible = true;
    }
  }

  display(ctx) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // how big tiles normally look
    const tileSize = constants.tileSize;
    // tile size is proportional to the amount of space (what?)
    // let screenTileSize = Math.min(canvas.width/this.width, canvas.height/this.height);
    // scale the whole thing based on how many tiles can fit
    // let scale = screenTileSize / tileSize;
    // first move the grid so that the center is in the center
    ctx.save();
    // ctx.translate(-1*this.width*this.tileSize / 2, -1*this.height*this.tileSize / 2);
    // ctx.scale(scale, scale);

    // get floor reference for use in anonymous func
    const floor = this;

    // loop through rooms
    this.rooms.forEach(room => {
      // ctx.fillRect((room.x+1)*tileSize, (room.y+1)*tileSize, (room.width-1)*tileSize, (room.height-1)*tileSize);
      // only draw visible rooms
      if (room.visible) {
        // loop through room
        for (let i = 0; i < room.width + 1; i++) {
          for (let j = 0; j < room.height + 1; j++) {
            // ctx.fillStyle = tileColors[floor.grid[room.x+i][room.y+j]];
            const type = floor.grid[room.x + i][room.y + j];
            // ctx.fillRect((room.x+i)*tileSize,(room.y+j)*tileSize,tileSize,tileSize);
            ctx.drawImage(images.tileset, tileImgWidth * type, 0, 32, 32, (room.x + i) * tileSize, (room.y + j) * tileSize, tileSize, tileSize);
          }
        }
      }
    });
    // console.log(i*j);
    ctx.restore();
  }

}

class Dungeon {
  constructor() {
    // list of tile maps
    this.floors = [];
  }
  addFloor(w_, h_) {
    const f = new Floor(w_, h_);
    f.generate(); // procedurally create walls and doors
    this.floors.push(f);
  }
}
// functions for visual effects
const effectsManager = {
  hitMarkers: [],
  sparks: [],
  addHitMarker(num, pos, color, multiplier) {
    this.hitMarkers.push(new HitMarker(num, pos, 1000, color, multiplier));
  },
  addSpark(pos, color) {
    this.sparks.push(new Spark(pos, 1000, color));
  },
  updateAll() {
    for (let i = this.hitMarkers.length - 1; i > -1; i--) {
      if (this.hitMarkers[i].checkExpiry() === 'expired') {
        this.hitMarkers.splice(i, 1);
      }
    }
    for (let i = this.sparks.length - 1; i > -1; i--) {
      if (this.sparks[i].checkExpiry() === 'expired') {
        this.sparks.splice(i, 1);
      }
    }
  },
  drawAll(ctx) {
    this.hitMarkers.forEach(hm => {
      hm.draw(ctx);
    });
    this.sparks.forEach(s => {
      s.draw(ctx);
    });
  }
};

class HitMarker {
  constructor(num, pos, lifetime, color, multiplier) {
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
      this.txt = `x${this.num}`;
    } else {
      // bubble text
      this.txt = `-${this.num}`;
      // check for whiff
      if (this.num === 0) this.txt = 'miss';
      // check for HP potion
      if (this.num < 0) {
        const posNum = -1 * this.num;
        this.txt = `+${posNum}`;
      }
    }
  }

  draw(ctx) {
    const percent = (this.startTime + this.lifetime - Date.now()) / this.lifetime;
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
}

class Spark {
  constructor(pos, lifeTime, color) {
    this.pos = pos;
    this.startTime = Date.now();
    this.lifetime = lifeTime;

    if (color) {
      this.color = color;
    } else {
      this.color = '#55f';
    }
  }

  checkExpiry() {
    // console.log("killTime: "+(this.startTime + this.lifetime));
    // console.log("currentTime: "+Date.now());
    if (Date.now() > this.startTime + this.lifetime) return 'expired';
  }

  draw(ctx) {
    // percent of life
    const percent = (this.startTime + this.lifetime - Date.now()) / this.lifetime;

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

}
// *** static functions ***
const createRandomEnemy = (lvlMin, lvlMax) => {
  lvlMin = lvlMin || 0;
  lvlMax = lvlMax || 1000000;
  const idxMin = lvlMin;
  const idxMax = lvlMax;
  /* for (let i=0; i<enemyTypes.length; i++) {
    if (enemyTypes[i].lvl > lvlMin) {
      idxMin = i;
    }
    if (enemyTypes[i].lvl < lvlMax) {
      idxMax = i;
    }
  }*/
  const a = idxMin + Math.floor(Math.random() * (idxMax - idxMin + 1));
  console.log(`a: ${a}`);
  return createEnemyByTypeIndex(a);
};

const createEnemyByTypeIndex = idx => {
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
class Enemy extends Character {
  constructor() {
    // call parent constructor
    super();

    // *** basic interactions ***
    this.awake = false; // sleeping until the player wakes it up

    // which room (relative to floor)
    this.roomNum = -1;
    // setter
    this.setRoomNum = function (num) {
      this.roomNum = num;
    };

    this.path = [];
  }

  // overwrite this for more complex behaviors
  updateBehavior() {
    this.seekClosestPlayer();
  }

  // move towards closest player
  seekClosestPlayer() {
    // player to pursue
    let target;
    let playerAlreadyFoundInSameRoom = false;
    const room = currentFloor.rooms[getRoomIdxFromTile(currentFloor.rooms, this.x, this.y)];
    let minDist = 1000000;
    // reference to this enemy inside anon func
    const e = this;
    // players is a global var
    players.forEach(function (p) {
      // player is in the same room as enemy
      if (currentFloor.rooms[getRoomIdxFromTile(currentFloor.rooms, p.x, p.y)] === room) {
        if (!playerAlreadyFoundInSameRoom) {
          target = p;
          const distSq = (p.x - e.x) * (p.x - e.x) + (p.y - e.y) * (p.y - e.y);
          minDist = distSq;
          playerAlreadyFoundInSameRoom = true;
        } else {
          const distSq = (p.x - e.x) * (p.x - e.x) + (p.y - e.y) * (p.y - e.y);
          if (distSq < minDist) {
            minDist = distSq;
            target = p;
          }
        }
      } else if (!playerAlreadyFoundInSameRoom) {
        const distSq = (p.x - this.x) * (p.x - this.x) + (p.y - this.y) * (p.y - this.y);
        if (distSq < minDist) {
          minDist = distSq;
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

    let dir;
    let vert = 0;
    let horiz = 0;
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
    let result;
    if (dir) {
      result = this.move(dir, dungeon.floors[currentFloorNum]);
    }
    if (result === 'wall') {
      /* for (let i=0; i<50; i++) {
        //currenFloor.grid[
      }*/
    }
  }
}
// inherit from parent
// Enemy.prototype = Object.create(Character.prototype);
// Enemy.prototype.constructor = Enemy;

const ratImg = new Image();
ratImg.src = 'images/rat.png';
// rat class
class Rat extends Enemy {
  constructor() {
    // call parent constructor
    super();

    // image
    this.image = ratImg;

    // *** enemy rpg attributes ***
    this.name = 'Rat';
    // threat level
    this.lvl = 1;
    // xp when killed
    this.xp = 1;
    // weapon
    this.weapon = weapons.stick; // start with a basic weapon
    // hp
    this.hp = 4;
    this.maxHp = 4;
    // strength
    this.strength = 4;
    // defense
    this.defense = 2; // dodge chance

    // draw with offset because the sprite is short
    this.offsetY = 10;
  }

  updateBehavior() {
    this.seekClosestPlayer();
  }
}
// inherit from parent
// Rat.prototype = Object.create(Enemy.prototype);
// Rat.prototype.constructor = Rat;
Rat.prototype.lvl = 1; // used by the createRandomEnemy func

const slimeImg = new Image();
slimeImg.src = 'images/slime.png';
// slime class
class Slime extends Enemy {
  constructor() {
    // call parent constructor
    super();

    // image
    this.image = slimeImg;

    // *** enemy rpg attributes ***
    this.name = 'Green Slime';
    // threat level
    this.lvl = 2;
    // xp when killed
    this.xp = 3;
    // weapon
    this.weapon = weapons.stick; // start with a basic weapon
    // hp
    this.hp = 10;
    this.maxHp = 10;
    // strength
    this.strength = 8;
    // defense
    this.defense = 2; // dodge chance

    // draw with offset because the sprite is short
    this.offsetY = 10;
  }

  updateBehavior() {
    this.seekClosestPlayer();
  }
}
// inherit from parent
// Slime.prototype = Object.create(Enemy.prototype);
// Slime.prototype.constructor = Slime;
Slime.prototype.lvl = 2; // used by the createRandomEnemy func

// list of the types of enemies
const enemyTypes = [Rat, Slime];
// *** GAME SCRIPT ***

// canvas elem
let canvas;
let ctx;
// the dungeon object
let dungeon;
// the spawn point on the current floor
const spawn = { x: 0, y: 0 };
// the lowest floor the player has been to
let bottomFloorNum = -1;
// the current floor index
let currentFloorNum = -1;
// floor reference
let currentFloor;
// the list of players
const players = [];
// A* nodes
const nodeMap = [];
// timer
let startTime = 0;
let gameTime = 0;
let skippedTime = 0;
let turnCount = 0;
const turnInterval = 500;
// offline if file url
const offline = window.location.toString()[0] === 'f';
console.log(offline);
const gridDimensions = { x: 18, y: 12 };

// initialize variables
const init = () => {
  canvas = document.querySelector('canvas');
  document.querySelector('#fullscreenBtn').onclick = fullScreen;
  canvas.onclick = fullScreen;
  ctx = canvas.getContext('2d');

  dungeon = new Dungeon();
  startGame();
};
window.addEventListener('load', init);

const fullScreen = () => {
  const elem = canvas;
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

const startGame = () => {
  // start the timer
  gameTime = startTime = Date.now();

  // enter a dungeon
  goToFloor(0);

  // if off-line create a character and activate keyboard controls
  if (offline) activateOfflineCharacter();

  gameLoop();
};

const activateOfflineCharacter = () => {
  addPlayer('offline');
  window.addEventListener('keydown', e => {
    if (e.ctrlKey) {
      // go down stairs
      handlePlayerInput('{ "name": "offline", "btn": "use [stairs]" }');
    }
  });
  window.addEventListener('keypress', e => {
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
const gameLoop = () => {
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
const update = () => {
  currentFloor.enemies.forEach(enemy => {
    if (currentFloor.rooms[enemy.roomNum].visible) {
      enemy.updateBehavior();
    }
  });
  players.forEach(player => {
    player.actionsLeft = 1;
    // send(player.name,"Your turn. Health: "+(player.hp/player.maxHp)); // send the controller an update
    // send(player.name,"Your turn "+Date.now()); // send the controller an update
    // player.x = player.futurePos.x;
    // player.y = player.futurePos.y;
  });
};

// draw to the screen
const draw = () => {
  // reset transform (scale 3)
  const gScale = 2;
  ctx.setTransform(gScale, 0, 0, gScale, 0, gScale);
  // draw floor
  currentFloor.display(ctx);

  // asfdasdfasfd
  let index = 0;
  // draw players
  players.forEach(player => {
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
      ctx.fillText(`P${index}`, canvas.width / 2 - 46, 14 + 15 * index);
    }
  });
  // draw enemies
  currentFloor.enemies.forEach(enemy => {
    if (currentFloor.rooms[enemy.roomNum].visible) {
      enemy.draw(ctx);
    }
  });
  currentFloor.items.forEach(item => {
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
const goToFloor = level => {
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
const handlePlayerInput = msg => {
  console.log(`input: ${msg}`);
  const inputData = JSON.parse(msg);
  let p = getPlayer(inputData.name);
  if (!p) p = addPlayer(inputData.name);
  if (inputData.btn.indexOf('THROW') >= 0) {
    // extract direction (after THROW_)
    const direction = inputData.btn.substring(6, inputData.btn.length);
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
const checkForAllReady = () => {
  let done = true;
  players.forEach(player => {
    if (player.actionsLeft > 0) done = false;
  });
  // if done, skip to turn end
  if (done) {
    // shorthand
    const gameTime = skippedTime + Date.now() - startTime;
    // skip ahead to next turn
    skippedTime += turnInterval - (gameTime - turnCount * turnInterval);
  }
};

// retrieves a player with a given name
const getPlayer = name => {
  for (let i = 0; i < players.length; i++) {
    if (players[i].name === name) {
      return players[i];
    }
  }
};

// add a new player
const addPlayer = (name, type) => {
  if (getPlayer(name)) return;
  console.log(`added ${name}`);
  const newb = new Player(name, type);
  newb.x = spawn.x;
  newb.y = spawn.y;
  newb.prevPos.x = spawn.x;
  newb.prevPos.y = spawn.y;
  players.push(newb);
  return newb;
  console.log(players);
};

// draw the turn timer
const drawTimer = (ctx, pos, percent) => {
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
let output;
let gameSocket;

const setupGameSocketIO = () => {
  gameSocket = io();
  gameSocket.emit('assert game', 'I am the game host');

  // handles player input, global func in game.js
  gameSocket.on('output', msg => {
    handlePlayerInput(msg);
  });

  gameSocket.on('add player', msg => {
    // new player
    const o = JSON.parse(msg);
    // add and track avatar
    addPlayer(o.name, o.type);
  });
  gameSocket.on('key', msg => {
    document.querySelector('.follow').innerHTML = `${document.querySelector('.follow').innerHTML}<br>room key: ${msg}`;
  });
};

const initSocket = () => {
  if (!offline) setupGameSocketIO();
  output = document.getElementById('resultsInner');
  console.log('Ready to begin');
};
const send = (recipientName, msg) => {
  if (offline) return;
  const json = `{ "name": "${recipientName}", "message": "${msg}"}`;
  gameSocket.emit('feedback', json);
};

window.addEventListener('load', initSocket);
// *** ITEM CLASSES ***

const weapons = {
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
const potionTypes = {
  'red potion': 'health potion',
  'green potion': 'strength potion',
  'blue potion': 'lightning potion'
};

// possible potion effects
const potionEffectsList = ['healing potion', 'strength potion', 'lightning potion'];

// Item base class
class Item extends GameObject {
  constructor(x, y, name) {
    super(x, y);
    // GameObject.call(this,x,y);
    this.name = name || 'no name';
    this.roomNum = -1;
    this.image = undefined;
  }
  setRoomNum(num) {
    this.roomNum = num;
  }
  draw() {
    ctx.drawImage(this.image, this.x * constants.tileSize, this.y * constants.tileSize);
  }
  removeFromFloor() {
    this.roomNum = -1;
    currentFloor.items.splice(currentFloor.items.indexOf(this), 1);
  }
}
// inherit from parent
// Item.prototype = Object.create(GameObject.prototype);
// Item.prototype.constructor = Item;

// the standard constructor for a gold pile
class GoldPile extends Item {
  constructor(x_, y_, num_) {
    super(x_, y_, 'gold');
    this.num = num_;
    this.image = new Image();
    this.image.src = 'images/Gold.png';
  }
}
// inherit from parent
// GoldPile.prototype = Object.create(Item.prototype);
// GoldPile.prototype.constructor = GoldPile;

// a magical potion of wonders
class Potion extends Item {
  constructor(x_, y_, type_) {
    super(x_, y_, `${type_ || 'red'} potion`);
    this.type = type_ || 'red';
    this.image = new Image();
    this.image.src = `images/${this.type}potion.png`;
  }
}
// inherit from parent
// Potion.prototype = Object.create(Item.prototype);
// Potion.prototype.constructor = Potion;
class Node {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.gScore = 0;
    this.fScore = 0;
    this.cameFrom = undefined;
  }
}

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
// *** global scope character data ***

// how much xp is needed to reach this level
const xpRequirements = [5, 15, 30, 50, 75, 100];
// store all possible images
const characterImages = [];
// load all the images
const createDwarfImg = i => {
  const img = new Image();
  img.src = `images/dwarf${i}.png`;
  characterImages.push(img);
};
window.addEventListener('load', () => {
  for (let i = 1; i < 7; i++) {
    createDwarfImg(i);
  }
});

// *** PLAYER CLASS ***
class Player extends Character {
  constructor(name_, type_) {
    // call parent constructor
    super(name_);

    // *** character rpg attributes ***
    // name
    this.name = name_ || 'unnamed';
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


    // define as player
    this.isPlayer = true;
    // class (type)
    this.type = type_ || 'Strong Murderhobo';
    // weapon
    this.weapon = weapons.stick;
    // differentiate characters
    this.color = Math.floor(Math.random() * 5);
    this.image = characterImages[this.color];
    this.inventory = [];
    // drawing
    this.visible = true;
  }

  dodge(attackerdefense) {
    return Math.random() < this.defense / (this.defense + attackerdefense * 10);
  }

  // add xp for
  addXp(val) {
    this.xp += val;
    this.checkForLvlUp();
  }

  // check to see if the player has enough xp
  checkForLvlUp() {
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
  throwItem(itemName, direction) {
    // debug
    console.log(`throwing ${itemName} ${direction}`);
    // remove from inventory
    const item = this.inventory.splice(this.inventory.indexOf(itemName), 1);
    // find out where the potion will land
    const landingSpot = this.getProjection(direction);
    // which effect?
    const effect = potionTypes[itemName];
    // apply effect based on what the item hits
    const target = gameTools.checkForEnemy(landingSpot.x, landingSpot.y);
    // if the target exists and so does the effect
    if (target && effect) {
      target.applyEffect(effect, this);
    } else if (effect === 'lightning potion') {
      powers.lightningBurst(this, landingSpot.x, landingSpot.y);
    }
  }

  // apply a potion's effect to the player
  drinkPotion(itemName) {
    // debug
    console.log(`drinking ${itemName}`);

    // remove from inventory
    const item = this.inventory.splice(this.inventory.indexOf(itemName), 1);
    // check valid
    if (!item) {
      return;
    }
    // which effect?
    const effect = potionTypes[itemName];
    // apply
    if (effect) this.applyEffect(effect, this);
  }

  checkAndResolveCollision(x, y) {
    // look for enemy
    let target = gameTools.checkForEnemy(x, y);
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
        let msg = `ITEM GET: ${target.name}`;
        if (target.name === 'gold') {
          this.gold += target.num;
          msg += ` ${target.num}`;
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

  hitWall() {
    // message phone
    send(this.name, 'you hit a wall');
  }

  death() {
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
  reset() {
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
// Player.prototype = Object.create(Character.prototype);
// Player.prototype.constructor = Player;
// utility consts

const getRandomArrayIndex = (array, padding) => {
  const pad = padding || 0;
  return pad + Math.floor(Math.random() * (array.length - pad));
};

const getRandomArrayElem = (array, padding) => {
  array[getRandomArrayIndex(array, padding)];
};

// shortcut for document.querySelector
const getByClass = className => {
  document.querySelector(`.${className}`);
};

// shortcut for document.querySelector
const getById = id => {
  document.getElementById(id);
};

// checks to see if an element has a class
const hasClass = (ele, cls) => {
  !!ele.className.match(new RegExp(`(\\s|^)${cls}(\\s|$)`));
};

// adds a class to an element
const addClass = (ele, cls) => {
  if (!hasClass(ele, cls)) ele.className += ` ${cls}`;
};

// removes a class from an element
const removeClass = (ele, cls) => {
  if (hasClass(ele, cls)) {
    const reg = new RegExp(`(\\s|^)${cls}(\\s|$)`);
    ele.className = ele.className.replace(reg, ' ');
  }
};

// shorthand for querySelector
const q = str => {
  document.querySelector(str);
};
