//CONFIG
const canvasWidth = 640;
const canvasHeight = 480;
const playerWidth = 30;
const playerHeight = 30;
const border = 5; // Between edge of canvas and play field
const minX = (canvasWidth / 2) - (canvasWidth - 10) / 2;
const maxY = (canvasWidth - playerWidth) - border;
const playFieldMinY = (canvasHeight / 2) - (canvasHeight - 100) / 2;
const playFieldMaxY = (canvasHeight - playerHeight) - border;
const generateStartPos = (min, max, multiple) => {
  return Math.floor(Math.random() * ((max - min) / multiple)) * multiple + min;
};

function getPositionX(multiple = 5) {
  return generateStartPos(
    minX,
    maxY,
    multiple,
  );
}

function getPositionY(multiple = 5) {
  return generateStartPos(
    playFieldMinY,
    playFieldMaxY,
    multiple,
  );
}
function generateCoinPosition(coin) {
  let x = coin.x || 80;
  let y = coin.y || 60;

  const nx = getPositionX();
  if (nx === x) {
    x = getPositionX(6);
  } else {
    x = nx;
  }

  const ny = getPositionY();
  if (ny === y) {
    y = getPositionY(6);
  } else {
    y = ny;
  }
  return { x, y };
}

module.exports = generateCoinPosition;
