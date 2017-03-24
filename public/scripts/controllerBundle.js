// CONTROLLER VARIABLES

// html elements
let outputDiv;
let controls;
let hpBar;

// sockets and online things
const controllerSocket = io();
let name = 'bob';
let roomKey = '';

// gameplay utils
let waitingMsg;
let failSafe;
let itemInfo = ''; // send item info to the game

// controller properties
let useClickOnly = false;
let useTouchOnly = false;

// CONTROLLER FUNCTIONS

// set up on start
const appInit = () => {
  // get controls table
  controls = document.getElementById('controls');
  // get hp bar
  hpBar = document.getElementById('healthBar');
  // sound
  yourTurnSound = document.getElementsByTagName('audio')[0];
  // waiting message
  waitingMsg = document.getElementById('waitingForPlayers');
  // hook up name button
  const submit = document.getElementById('submitBtn');
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
const attemptJoin = () => {
  name = document.getElementById('nameInput').value;
  roomKey = document.getElementById('roomInput').value.toUpperCase();
  const json = `{ "name": "${name}", ` + `"roomKey": "${roomKey}" }`;
  controllerSocket.emit('join', json);
};

// game replied OK
const joinSucceed = () => {
  document.getElementById('nameScreen').style.display = 'none';
  document.getElementById('controllerScreen').style.display = 'block';
  // show welcome msg
  output(`Welcome, ${name}`);
};

// if there was an error, alert
const joinFail = status => {
  alert(status);
};

// print to the onscreen log
const output = str => {
  outputDiv.innerHTML = `${str}<br>${outputDiv.innerHTML.substring(0, 2000)}`;
};

// start a turn (not used)
const turnStart = () => {
  setControlsVisibility(true);
  yourTurnSound.play();
};

// show the movement controls
const setControlsVisibility = visible => {
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
const updateFailed = () => {
  setControlsVisibility(true);
  alert('failsafe triggered after 5 seconds of no message from the server');
};

// set the healthbar
const setHealthBar = percent => {
  hpBar.style.width = `${percent * 100}%`;
};

// debugger
const mobileDebug = enabled => {
  if (enabled) {
    window.onerror = function (errorMsg, url, linenumber) {
      handleErrorMobile(errorMsg, url, linenumber);
    };
  } else {
    // dbg.style.display = "none";
  }
};

const handleErrorMobile = (errorMsg, url, linenumber) => {
  output(`${errorMsg}: line ${linenumber}`);
};

// When the game gives a response, record it
const handleMessageFromGame = msg => {
  // player got an item
  if (msg.indexOf('ITEM GET: ') > -1) {
    // add to inventory (handled in inventory.js)
    //itemGet(msg.substring(10));
  }
};

// window onload, initialize
window.addEventListener('load', appInit);

// button pressed, make quick adjustments
const preSendActions = btnType => {
  // if the action involved an inventory item
  if (btnType.indexOf('drink') >= 0) {
    // send item info to the game
    itemInfo = btnType.substring(btnType.indexOf('[') + 1, btnType.indexOf(']'));
  }
};

const postSendActions = btnType => {
  if (btnType.indexOf('drink') >= 0) {
    drinkPotion(itemInfo);
    // clear meta
    itemInfo = '';
  }
};

const simulateButtonPress = buttonString => {
  // change the item text to fit
  preSendActions(buttonString);

  // create a json string with information about the controller's button press
  const jsonString = `${'{' + '"name": "'}${name}", ` + `"btn": "${buttonString}", ` + `"item": "${itemInfo}" }`;
  controllerSocket.emit('input', jsonString);

  // empty inventory slot
  postSendActions(buttonString);
};

// setup sockets
const setupSocketIO = () => {
  const buttons = document.querySelectorAll('td');
  for (let i = 0; i < buttons.length; i++) {
    // universal touch event for all buttons
    const setClick = function (btn) {
      // only fire one of these, click or touch, not both
      btn.addEventListener('click', () => {
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
      btn.addEventListener('touchstart', () => {
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
  controllerSocket.on('output', msg => {
    handleMessageFromGame(msg);
    output(msg);
  });
  controllerSocket.on('join status', status => {
    if (status == 'success') {
      joinSucceed();
    } else {
      joinFail(status);
    }
  });
};
// Inventory on the controller

const images = {
  'red potion': 'images/pt1.png',
  'green potion': 'images/pt3.png',
  'blue potion': 'images/pt2.png',
  'orange potion': 'images/pt4.png'
};

const potions = ['red potion', 'green potion', 'blue potion'];

const numPotions = {
  'red potion': 0,
  'green potion': 0,
  'blue potion': 0
};

let gold = 0;

const inventory = [];

const slots = [];

const counters = [];

const controlButtons = [];

let selectedSlot = -1;

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
  const slotNodes = document.querySelectorAll('#inventory .slot');
  for (var i = 0; i < slotNodes.length; ++i) {
    slots[i] = slotNodes[i]; // assign to a real array
  }

  const counterNodes = document.querySelectorAll('#inventory .counter');
  for (var i = 0; i < counterNodes.length; ++i) {
    counters[i] = counterNodes[i]; // assign to a real array
  }

  const btnNodes = document.querySelectorAll('#controls td');
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
  output(`new item: ${itemName}`);
  for (let i = 0; i < inventory.length; i++) {
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
  const n = document.createElement('div');
  // correct image
  n.style.backgroundImage = `url(${images[inventory[index]]})`;
  // class name = item name
  // n.setAttribute("class",inventory[index]);
  n.setAttribute('class', 'pic');
  // event listener
  n.addEventListener('touchstart', () => {
    // debug
    output(`${inventory[index]} tapped`);

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
  const n = document.createElement('div');

  // correct image
  n.style.backgroundImage = `url(${images[potions[index]]})`;

  // class name = pic
  n.setAttribute('class', 'pic');

  // event listener
  n.addEventListener('touchstart', () => {
    // debug
    output(`${potions[index]} tapped`);
    if (numPotions[potions[index]] > 0) {
      simulateButtonPress(`drink [${potions[index]}]`);
    }
  });

  // add to table
  slots[index].appendChild(n);
}

function addGold(num) {
  gold += num;
  document.getElementById('goldBtn').innerHTML = `Gold:<br>${gold}`;
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
