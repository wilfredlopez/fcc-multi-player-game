const generateCoinPosition = require("./generateCointPosition");
class Coin {
  constructor(
    { x = 80, y = 60, w = 15, h = 15, value = 1, id = 1 } = {},
  ) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.value = value;
    this.id = id;
    this.count = 0;
  }

  shouldUpgrade() {
    return this.count > 3;
  }

  setValue(value) {
    if (this.shouldUpgrade()) {
      this.count = 0;
      this.value = value + 1;
      if (this.value > 3) {
        this.value = 1;
      }
    } else {
      this.count++;
    }
  }

  update({ id, value }) {
    this.id = id;
    this.setValue(value);
    const { x, y } = generateCoinPosition(this);
    this.x = x;
    this.y = y;
    return this;
  }
}

module.exports = Coin;
