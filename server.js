require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const expect = require("chai");
const socket = require("socket.io");
const fccTestingRoutes = require("./routes/fcctesting.js");
const runner = require("./test-runner.js");
const app = express();
const Coin = require("./Coin");
app.use("/public", express.static(process.cwd() + "/public"));
app.use("/assets", express.static(process.cwd() + "/assets"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet({
  hidePoweredBy: {
    setTo: "PHP 7.4.3",
  },
}));

app.use(function (req, res, next) {
  res.setHeader("surrogate-control", "no-store");
  res.setHeader(
    "cache-control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("pragma", "no-cache");
  res.setHeader("expires", "0");
  next();
});

// Index page (static HTML)
app.route("/")
  .get(function (req, res) {
    res.sendFile(process.cwd() + "/views/index.html");
  });

//For FCC testing purposes
fccTestingRoutes(app);

// 404 Not Found Middleware
app.use(function (req, res, next) {
  res.status(404)
    .type("text")
    .send("Not Found");
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV === "test") {
    console.log("Running Tests...");
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log("Tests are not valid:");
        console.error(error);
      }
    }, 1500);
  }
});

let players = [];

const coin = new Coin();

const io = socket(server);
io.on("connection", (socket) => {
  console.log("user", socket.id, "connected");
  coin.id = socket.id;
  io.emit("init", { id: socket.id, players: players, coin: coin });

  socket.on("new-player", (newplayer) => {
    players.push(newplayer);
    io.emit("new-player", newplayer);
  });

  socket.on("disconnect", () => {
    const index = players.findIndex((p) => p.id === socket.id);
    if (index !== -1) {
      players.splice(index, 1);
    }
    io.emit("remove-player", socket.id);
  });

  socket.on("stop-player", (dir, { x, y }) => {
    io.emit("stop-player", { id: socket.id, dir, posObj: { x, y } });
  });

  socket.on("move-player", (dir, { x, y }) => {
    const index = players.findIndex((p) => p.id === socket.id);
    if (index !== -1) {
      players[index].x = x;
      players[index].y = y;
      const posObj = { x, y };
      io.emit("move-player", { id: socket.id, dir, posObj });
    }
  });

  socket.on(
    "destroy-item",
    ({ playerId, coinValue, coinId }) => {
      const player = players.find((o) => o.id === playerId);
      if (player) {
        player.score += coinValue;
        io.emit("update-player", player);
        coin.update({
          id: coinId,
          value: coinValue,
        });

        //60
        if (player.score >= 60) {
          io.emit("end-game", "WIN!");
        } else {
          io.emit("new-coin", coin);
        }
      }
    },
  );
});

module.exports = app; // For testing
