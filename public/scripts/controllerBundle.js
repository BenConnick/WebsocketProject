'use strict';

// CONTROLLER VARIABLES

// html elements
var outputDiv = void 0;
var controls = void 0;
var hpBar = void 0;

// sockets and online things
var controllerSocket = io();
var name = 'bob';
var roomKey = '';

// gameplay utils
var waitingMsg = void 0;
var failSafe = void 0;
var itemInfo = ''; // send item info to the game

// controller properties
var useClickOnly = false;
var useTouchOnly = false;

// CONTROLLER FUNCTIONS

// set up on start
var appInit = function appInit() {
  // get controls table
  controls = document.getElementById('controls');
  // get hp bar
  hpBar = document.getElementById('healthBar');
  // sound
  yourTurnSound = document.getElementsByTagName('audio')[0];
  // waiting message
  waitingMsg = document.getElementById('waitingForPlayers');
  // hook up name button
  var submit = document.getElementById('submitBtn');
  submit.onclick = function () {
    console.log('join');
    attemptJoin();
  };
  // handles communication with the server
  setupSocketIO();
  // debugging and talking to the player
  outputDiv = document.getElementById('resultsInner');
  // if there is an error, output it so the user can see
  mobileDebug(true);

  // offline
  if (window.location.toString()[0] == 'f') {}
  // document.getElementById("nameScreen").style.display = "none";
  // document.getElementById("controllerScreen").style.display = "block";


  //inventoryInit();
};

// join a game
var attemptJoin = function attemptJoin() {
  name = document.getElementById('nameInput').value;
  roomKey = document.getElementById('roomInput').value.toUpperCase();
  var json = '{ "name": "' + name + '", ' + ('"roomKey": "' + roomKey + '" }');
  controllerSocket.emit('join', json);
};

// game replied OK
var joinSucceed = function joinSucceed() {
  document.getElementById('nameScreen').style.display = 'none';
  document.getElementById('controllerScreen').style.display = 'block';
  // show welcome msg
  output('Welcome, ' + name);
};

// if there was an error, alert
var joinFail = function joinFail(status) {
  alert(status);
};

// print to the onscreen log
var output = function output(str) {
  outputDiv.innerHTML = str + '<br>' + outputDiv.innerHTML.substring(0, 2000);
};

// start a turn (not used)
var turnStart = function turnStart() {
  setControlsVisibility(true);
  yourTurnSound.play();
};

// show the movement controls
var setControlsVisibility = function setControlsVisibility(visible) {
  if (visible) {
    controls.style.opacity = 1;
    controls.style.pointerEvents = 'auto';
    waitingMsg.style.display = 'none';
    window.clearTimeout(failSafe);
  } else {
    controls.style.opacity = 0;
    controls.style.pointerEvents = 'none';
    waitingMsg.style.display = 'block';
    failSafe = window.setTimeout(updateFailed, 5000);
  }
};

// if the connection times out, the controls might be locked
var updateFailed = function updateFailed() {
  setControlsVisibility(true);
  alert('failsafe triggered after 5 seconds of no message from the server');
};

// set the healthbar
var setHealthBar = function setHealthBar(percent) {
  hpBar.style.width = percent * 100 + '%';
};

// debugger
var mobileDebug = function mobileDebug(enabled) {
  if (enabled) {
    window.onerror = function (errorMsg, url, linenumber) {
      handleErrorMobile(errorMsg, url, linenumber);
    };
  } else {
    // dbg.style.display = "none";
  }
};

var handleErrorMobile = function handleErrorMobile(errorMsg, url, linenumber) {
  output(errorMsg + ': line ' + linenumber);
};

// When the game gives a response, record it
var handleMessageFromGame = function handleMessageFromGame(msg) {
  // player got an item
  if (msg.indexOf('ITEM GET: ') > -1) {
    // add to inventory (handled in inventory.js)
    //itemGet(msg.substring(10));
  }
};

// window onload, initialize
window.addEventListener('load', appInit);

// button pressed, make quick adjustments
var preSendActions = function preSendActions(btnType) {
  // if the action involved an inventory item
  if (btnType.indexOf('drink') >= 0) {
    // send item info to the game
    itemInfo = btnType.substring(btnType.indexOf('[') + 1, btnType.indexOf(']'));
  }
};

var postSendActions = function postSendActions(btnType) {
  if (btnType.indexOf('drink') >= 0) {
    drinkPotion(itemInfo);
    // clear meta
    itemInfo = '';
  }
};

var simulateButtonPress = function simulateButtonPress(buttonString) {
  // change the item text to fit
  preSendActions(buttonString);

  // create a json string with information about the controller's button press
  var jsonString = '' + ('{' + '"name": "') + name + '", ' + ('"btn": "' + buttonString + '", ') + ('"item": "' + itemInfo + '" }');
  controllerSocket.emit('input', jsonString);

  // empty inventory slot
  postSendActions(buttonString);
};

// setup sockets
var setupSocketIO = function setupSocketIO() {
  var buttons = document.querySelectorAll('td');
  for (var i = 0; i < buttons.length; i++) {
    // universal touch event for all buttons
    var setClick = function setClick(btn) {
      // only fire one of these, click or touch, not both
      btn.addEventListener('click', function () {
        if (!useClickOnly && !useTouchOnly) {
          useClickOnly = true;
        }
        if (useClickOnly) {
          simulateButtonPress(btn.textContent);
        }
        return false;
      });
      // use this for mobile
      // commented out because it doesn't work with mouse
      btn.addEventListener('touchstart', function () {
        if (!useClickOnly && !useTouchOnly) {
          useTouchOnly = true;
        }
        if (useTouchOnly) {
          simulateButtonPress(btn.textContent);
        }
        return false;
      });
    };
    setClick(buttons[i]);
  }
  controllerSocket.on('output', function (msg) {
    handleMessageFromGame(msg);
    output(msg);
  });
  controllerSocket.on('join status', function (status) {
    if (status == 'success') {
      joinSucceed();
    } else {
      joinFail(status);
    }
  });
};
'use strict';

// Inventory on the controller

var images = {
  'red potion': 'images/pt1.png',
  'green potion': 'images/pt3.png',
  'blue potion': 'images/pt2.png',
  'orange potion': 'images/pt4.png'
};

var potions = ['red potion', 'green potion', 'blue potion'];

var numPotions = {
  'red potion': 0,
  'green potion': 0,
  'blue potion': 0
};

var gold = 0;

var inventory = [];

var slots = [];

var counters = [];

var controlButtons = [];

var selectedSlot = -1;

// add an item to the inventory
function itemGet(itemString) {
  // gold is formatted in a special way
  if (itemString.substring(0, 4) == 'gold') {
    // extract the amount of gold from the item string
    addGold(parseInt(itemString.substring(5, itemString.length)));

    // done
    return;
  }

  // var validItem = false;

  // add potion to the list
  numPotions[itemString]++;
  updatePotionCounters();

  // add the item
  // if (validItem) {
  // addItemToFirstOpenSlot(itemString);
  // } else {
  // alert("invalid item");
  // }
  // display the current inventory state
}

function drinkPotion(potionName) {
  numPotions[potionName]--;
  updatePotionCounters();
}

// inventory setup
function inventoryInit() {
  // get references to slot html (table column children of element with id "inventory")
  var slotNodes = document.querySelectorAll('#inventory .slot');
  for (var i = 0; i < slotNodes.length; ++i) {
    slots[i] = slotNodes[i]; // assign to a real array
  }

  var counterNodes = document.querySelectorAll('#inventory .counter');
  for (var i = 0; i < counterNodes.length; ++i) {
    counters[i] = counterNodes[i]; // assign to a real array
  }

  var btnNodes = document.querySelectorAll('#controls td');
  for (var i = 0; i < btnNodes.length; ++i) {
    controlButtons[i] = btnNodes[i]; // assign to a real array
  }

  output('creating potions');
  // initialize buttons
  for (var i = 0; i < 3; i++) {
    createPotionSlot(i);
  }

  /* // load images
  for (imageName in images) {
  	var url = images[imageName];
  	images[imageName] = new Image();
  	images[imageName].src = url;
  }*/

  // fill inventory
  for (var i = 0; i < slots.length; i++) {
    inventory[i] = '';
  }
}

// window onload, initialize
// window.addEventListener('load',inventoryInit);

function addItemToFirstOpenSlot(itemName) {
  output('new item: ' + itemName);
  for (var i = 0; i < inventory.length; i++) {
    if (!inventory[i] || inventory[i] == '') {
      inventory[i] = itemName;
      updateInventorySlot(i);
      break;
    }
  }
}

function updateInventorySlot(index) {
  // output("updating inventory");
  // output(slots[index].toString());
  // output(images[inventory[index]].toString());

  // create a new div
  var n = document.createElement('div');
  // correct image
  n.style.backgroundImage = 'url(' + images[inventory[index]] + ')';
  // class name = item name
  // n.setAttribute("class",inventory[index]);
  n.setAttribute('class', 'pic');
  // event listener
  n.addEventListener('touchstart', function () {
    // debug
    output(inventory[index] + ' tapped');

    // if the slot is not selected, select it
    if (selectedSlot != index) {
      updateSelected(index);
      // else deselect it
    } else {
      updateSelected(-1);
    }
  });

  // add to table
  slots[index].appendChild(n);
}

function createPotionSlot(index) {
  // create a new div
  var n = document.createElement('div');

  // correct image
  n.style.backgroundImage = 'url(' + images[potions[index]] + ')';

  // class name = pic
  n.setAttribute('class', 'pic');

  // event listener
  n.addEventListener('touchstart', function () {
    // debug
    output(potions[index] + ' tapped');
    if (numPotions[potions[index]] > 0) {
      simulateButtonPress('drink [' + potions[index] + ']');
    }
  });

  // add to table
  slots[index].appendChild(n);
}

function addGold(num) {
  gold += num;
  document.getElementById('goldBtn').innerHTML = 'Gold:<br>' + gold;
}

// show highlight on a slot
function updateSelected(newSlot) {
  if (selectedSlot >= 0) {
    // remove the highlight class (see utilities.js)
    removeClass(slots[selectedSlot], 'highlight');
  }
  if (newSlot >= 0) {
    addClass(slots[newSlot], 'highlight');
  }
  selectedSlot = newSlot;
}

// use an item
function removeItem(index) {
  // clear image
  slots[index].innerHTML = '';
  // clear from array
  inventory[index] = '';
}

function updatePotionCounters() {
  counters[0].innerHTML = numPotions['red potion'];
  counters[1].innerHTML = numPotions['green potion'];
  counters[2].innerHTML = numPotions['blue potion'];
}
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
