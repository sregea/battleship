// This is the master class for the game.

// Import the server module to communicate with it.
let server = require('./server.js');

// Import the child classes.
let MasterMap = require('./mastermap.js');

// Define the master class.
class Master {
  constructor() {
    this.mode = 'wait';
    this.players = [];

    // Initialize the map.
    this.map = new MasterMap();

    // Calculate some sizes for the game.
    /*
    let canvasx = 500;
    let canvasy = 600;
    let xsize = Math.min(canvasx, canvasy) * 3 / 4;
    let ysize = xsize;
    let size = xsize / 10;
    let initialx = (canvasx - xsize) / 2;
    let initialy = (canvasy - ysize) / 2;
    this.sizes = {
      initialx: initialx,
      initialy: initialy,
      xsize: xsize,
      ysize: ysize,
      size: size,
    };
    */

    // Decide some sizes for the enemy's map.
    /*
    let enemyMap = {

    };*/

    // Bundle all this information.
    /*
    this.data = {
      canvasx: canvasx,
      canvasy: canvasy,
      sizes: this.sizes
    };

    // Create the maps for the two players.
    this.map = new Map(this.sizes);
    //this.maps = [map1, map2];
    //this.map = new Map(myMap);
    //this.maps = [map1, map2];
    */
  }

  ready(data) {
    console.log('Client with id: ' + data.socketId + ' wants to play');

    // Check if the client is already a player.
    if (this.getPlayer(data.socketId) != 0) {
      console.log('Client is already a player. Ignoring');
      return;
    }

    // Check if the room is full.
    if (this.players.length == 2) {
      console.log(' The room is currently full. Ignoring');
      return;
    }

    let newPlayer;

    switch (this.players.length) {
      case 0:
        console.log('Client is accepted as player 1');
        newPlayer = {
          playerId: 1,
          socketId: data.socketId,
        };

        // Add player to the master information.
        this.players.push(newPlayer);

        // Broadcast info about the new player.
        server.send('addPlayer', newPlayer, 'all');
        break;
      case 1:
        console.log('Player is accepted as player 2');
        newPlayer = {
          playerId: 2,
          socketId: data.socketId,
        };

        // Add the player to the master information.
        this.players.push(newPlayer);

        // Broadcast info about the new player.
        server.send('addPlayer', newPlayer, 'all');

        // Change mode and inform clients.
        this.mode = 'prepare';
        console.log('Master is in prepare mode');
        server.send('updateMode', 'prepare', 'all');
        break;
    }
  }

  getPlayer(socketId) {
    // Receives a socket id and decides if it corresponds to a player.
    for (let k = 0; k < this.players.length; k++) {
      if (this.players[k].socketId == socketId) {
        // Client is already a player.
        return this.players[k].playerId;
      }
    }
    return 0;
  }

  receive(data) {
    // Receives a map from a player after preparing.
    console.log('Updating map from player ' + data.playerId);
    this.map.receive(data);

    // If both maps have been received, get into play mode.
    if (this.bothReceived()) {
      this.mode = 'play';

      // Update modes and maps to clients.
      server.send('updateMode', this.mode, 'all');
      server.send('finalMaps', this.map.grid, 'all');

      // Log the maps to the server's terminal.
      this.map.logMap();
    }
  }

  bothReceived() {
    // Decides if the maps from the two players have been received.
    return this.map.info["player1"].receivedMap && this.map.info["player2"].receivedMap;
  }

  click(data) {
    // Receives a click inside the canvas from a client and treats it.
    console.log('Receiving a click from client ' + data.socketId);

    // Check that we are in play mode.
    if (this.mode != 'play') {
      console.log('Not in play mode. Ignoring');
      return;
    }

    // Check that the client is a player.
    let playerId = this.getPlayer(data.socketId);
    if (playerId == 0) {
      console.log('Client is not a player. Ignoring');
      return;
    }

    // TODO: Check that it's this player's turn.

    // Check that the click was inside the enemy grid.
    if (!this.map.clickedEnemyGrid(data.mx, data.my)) {
      console.log('Click outside the enemy grid. Ignoring');
      return;
    }

    let toSend = this.map.bomb(playerId, data.mx, data.my);
    server.send('bombing', toSend, 'all');


    /*
    // Check that the click was inside the grid.
    let clicked = this.map.clicked(data.mx, data.my, this.mode);
    if (clicked == undefined) {
      console.log('The click was outside the grid. Ignoring');
      return;
    }
    else {
      // Update the information in master.
      this.map.addBoat(clicked[0], clicked[1], playerId);

      // Broadcast this map change.
      server.send('updateMaps', this.map.grid);
    }*/
  }
}

// Export the master class.
module.exports = Master;
