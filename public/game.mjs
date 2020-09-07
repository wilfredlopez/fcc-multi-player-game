import Player from "./Player.mjs";
import Collectible from "./Collectible.mjs";
import calculations from "./calculations.mjs";

const genPosition = (min, max, multiple) => {
  return Math.floor(Math.random() * ((max - min) / multiple)) * multiple + min;
};

const setUpEvents = (player, socket) => {
  const getKey = (e) => {
    if (e.keyCode === 87 || e.keyCode === 38) return "up";
    if (e.keyCode === 83 || e.keyCode === 40) return "down";
    if (e.keyCode === 65 || e.keyCode === 37) return "left";
    if (e.keyCode === 68 || e.keyCode === 39) return "right";
  };

  document.onkeydown = (e) => {
    let dir = getKey(e);
    if (dir) {
      player.moveDir(dir);
      socket.emit("move-player", dir, { x: player.x, y: player.y });
    }
  };

  document.onkeyup = (e) => {
    let dir = getKey(e);
    if (dir) {
      player.stopDir(dir);
      socket.emit("stop-player", dir, { x: player.x, y: player.y });
    }
  };
};

const socket = io();
const canvas = document.getElementById("game-window");
const context = canvas.getContext("2d", { alpha: false });

const getImage = (src) => {
  const img = new Image();
  img.src = src;
  return img;
};

const bronzeCoin = getImage("./assets/bronze-coin.png");
const silverCoin = getImage("./assets/silver-coin.png");
const goldCoin = getImage("./assets/gold-coin.png");
const mainPlayerImg = getImage("./assets/main-player.png");
const otherPlayerImg = getImage("./assets/other-player.png");

let tick;
let currPlayers = [];
let item;
let endGame;

socket.on("init", ({ id, players, coin }) => {
  console.log(`Connected ${id}`);

  cancelAnimationFrame(tick);

  // INIT PLAYER
  const actualPlayer = new Player({
    x: genPosition(
      calculations.playFieldMinX,
      calculations.playFieldMaxX,
      5,
    ),
    y: genPosition(
      calculations.playFieldMinY,
      calculations.playFieldMaxY,
      5,
    ),
    id,
    main: true,
  });

  setUpEvents(actualPlayer, socket);

  // Send our player back to the server
  socket.emit("new-player", actualPlayer);

  socket.on("new-player", (obj) => {
    const playerIds = currPlayers.map((player) => player.id);
    if (!playerIds.includes(obj.id)) currPlayers.push(new Player(obj));
  });

  // MOVE PLAYER
  socket.on("move-player", ({ id, dir, posObj }) => {
    const movingPlayer = currPlayers.find((obj) => obj.id === id);
    movingPlayer.moveDir(dir);

    movingPlayer.x = posObj.x;
    movingPlayer.y = posObj.y;
  });

  socket.on("stop-player", ({ id, dir, posObj }) => {
    const stoppingPlayer = currPlayers.find((obj) => obj.id === id);
    stoppingPlayer.stopDir(dir);

    stoppingPlayer.x = posObj.x;
    stoppingPlayer.y = posObj.y;
  });

  // set new coin
  socket.on("new-coin", (newCoin) => {
    item = new Collectible(newCoin);
  });

  // Remove Player
  socket.on("remove-player", (id) => {
    console.log(`${id} disconnected`);
    currPlayers = currPlayers.filter((player) => player.id !== id);
  });

  // End the Game
  socket.on("end-game", (result) => endGame = result);

  // Update players score
  socket.on("update-player", (playerObj) => {
    const scoringPlayer = currPlayers.find((obj) => obj.id === playerObj.id);
    scoringPlayer.score = playerObj.score;
  });

  // Populate players
  currPlayers = players.map((val) => new Player(val)).concat(actualPlayer);
  item = new Collectible(coin);

  drawCanvas();
});

const drawCanvas = () => {
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Set background color
  context.fillStyle = "#222e38";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Create border for play field
  context.strokeStyle = "white";
  context.strokeRect(
    calculations.playFieldMinX,
    calculations.playFieldMinY,
    calculations.playFieldWidth,
    calculations.playFieldHeight,
  );

  context.fillStyle = "#fff";
  context.font = `15px Arial`;
  context.textAlign = "center";
  context.fillText("Controls: WASD", 100, 32.5);

  context.font = `18px Arial`;
  context.fillText("Coin Race", calculations.canvasWidth / 2, 32.5);

  // Calculate score and draw players each frame
  currPlayers.forEach((player) => {
    player.draw(
      context,
      item,
      { mainPlayerImg, otherPlayerImg },
      currPlayers,
    );
  });

  // Draw current coin
  item.drawCoin(
    context,
    {
      bronzeCoin,
      silverCoin,
      goldCoin,
    },
  );

  // Remove destroyed coin
  if (item.destroyed) {
    socket.emit(
      "destroy-item",
      { playerId: item.destroyed, coinValue: item.value, coinId: item.id },
    );
  }

  if (endGame) {
    context.fillStyle = "#fff";
    context.font = `18px Arial`;
    context.fillText(
      `You ${endGame}! Restart and try again.`,
      calculations.canvasWidth / 2,
      80,
    );
  }

  if (!endGame) tick = requestAnimationFrame(drawCanvas);
};
