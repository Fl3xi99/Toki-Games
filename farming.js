// Farming Game with Crop Types, Land Expansion, Leveling System & XP Bar
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tileSize = 40;
const rows = 10;
const cols = 16;

const field = Array(rows).fill().map(() => Array(cols).fill(null));
const timers = Array(rows).fill().map(() => Array(cols).fill(0));
const landMap = Array(rows).fill().map(() => Array(cols).fill(false));

const player = { x: 7, y: 4 };
let keys = {};
let actionLock = false;
let selectedCrop = "wheat";

let inventory = {
  crops: { wheat: 0, corn: 0 },
  seeds: { wheat: 3, corn: 0 },
  coins: 20
};

let playerStats = {
  level: 1,
  xp: 0,
  xpToNext: 5
};

let marketOpen = false;

const cropTypes = {
  wheat: {
    growTime: 300,
    price: 5,
    image: new Image(),
    imageGrown: new Image(),
    seedCost: 3
  },
  corn: {
    growTime: 450,
    price: 8,
    image: new Image(),
    imageGrown: new Image(),
    seedCost: 5
  }
};

const playerImg = new Image();
playerImg.src = "PHOTOS/farmer.png";
cropTypes.wheat.image.src = "PHOTOS/wheat_half.png";
cropTypes.wheat.imageGrown.src = "PHOTOS/wheat.png";
cropTypes.corn.image.src = "PHOTOS/corn_half.png";
cropTypes.corn.imageGrown.src = "PHOTOS/corn.png";

[playerImg, cropTypes.wheat.image, cropTypes.wheat.imageGrown, cropTypes.corn.image, cropTypes.corn.imageGrown].forEach(img => img.onload = () => {});

// Unlock initial land (middle 8 tiles)
for (let y = 4; y < 6; y++) {
  for (let x = 6; x < 10; x++) {
    landMap[y][x] = true;
  }
}

// Input handlers
document.addEventListener("keydown", e => {
  keys[e.key] = true;
});
document.addEventListener("keyup", e => {
  keys[e.key] = false;
  if ([" ", "m"].includes(e.key)) actionLock = false;
});

function update() {
  if (marketOpen) {
    if (keys["s"] && inventory.crops[selectedCrop] > 0) {
      inventory.crops[selectedCrop]--;
      inventory.coins += cropTypes[selectedCrop].price;
      keys["s"] = false;
    }
    if (keys["b"] && inventory.coins >= cropTypes[selectedCrop].seedCost) {
      inventory.seeds[selectedCrop]++;
      inventory.coins -= cropTypes[selectedCrop].seedCost;
      keys["b"] = false;
    }
    if (keys["e"] && inventory.coins >= 20) {
      unlockMoreLand();
      inventory.coins -= 20;
      keys["e"] = false;
    }
  } else {
    if (keys["ArrowLeft"]) { player.x = Math.max(0, player.x - 1); keys["ArrowLeft"] = false; }
    if (keys["ArrowRight"]) { player.x = Math.min(cols - 1, player.x + 1); keys["ArrowRight"] = false; }
    if (keys["ArrowUp"]) { player.y = Math.max(0, player.y - 1); keys["ArrowUp"] = false; }
    if (keys["ArrowDown"]) { player.y = Math.min(rows - 1, player.y + 1); keys["ArrowDown"] = false; }

    if (keys[" "] && !actionLock && landMap[player.y][player.x]) {
      const tile = field[player.y][player.x];
      if (!tile && inventory.seeds[selectedCrop] > 0) {
        field[player.y][player.x] = { type: selectedCrop, stage: 1 };
        timers[player.y][player.x] = 0;
        inventory.seeds[selectedCrop]--;
      } else if (tile && tile.stage === 2) {
        inventory.crops[tile.type]++;
        playerStats.xp++;
        checkLevelUp();
        field[player.y][player.x] = null;
      }
      actionLock = true;
    }
  }

  if (keys["m"] && !actionLock) {
    marketOpen = !marketOpen;
    actionLock = true;
  }
  if (keys["1"]) selectedCrop = "wheat";
  if (keys["2"]) selectedCrop = "corn";

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = field[y][x];
      if (tile && tile.stage === 1) {
        timers[y][x]++;
        if (timers[y][x] >= cropTypes[tile.type].growTime) {
          tile.stage = 2;
        }
      }
    }
  }
}

function checkLevelUp() {
  if (playerStats.xp >= playerStats.xpToNext) {
    playerStats.xp -= playerStats.xpToNext;
    playerStats.level++;
    playerStats.xpToNext = Math.floor(playerStats.xpToNext * 1.5);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      ctx.strokeStyle = landMap[y][x] ? "#888" : "#333";
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      if (landMap[y][x]) {
        ctx.fillStyle = "#444";
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        const tile = field[y][x];
        if (tile) {
          const cropImg = tile.stage === 2 ? cropTypes[tile.type].imageGrown : cropTypes[tile.type].image;
          ctx.drawImage(cropImg, x * tileSize, y * tileSize, tileSize, tileSize);
        }
      } else {
        ctx.fillStyle = "#111";
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }

  ctx.drawImage(playerImg, player.x * tileSize, player.y * tileSize, tileSize, tileSize);

  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.fillText(`Coins: $${inventory.coins}`, 10, canvas.height - 100);
  ctx.fillText(`Seeds - Wheat: ${inventory.seeds.wheat}, Corn: ${inventory.seeds.corn}`, 10, canvas.height - 80);
  ctx.fillText(`Crops - Wheat: ${inventory.crops.wheat}, Corn: ${inventory.crops.corn}`, 10, canvas.height - 60);
  ctx.fillText(`Level: ${playerStats.level}`, 10, canvas.height - 40);
  ctx.fillText(`XP: ${playerStats.xp}/${playerStats.xpToNext}`, 10, canvas.height - 20);

  // XP bar
  ctx.fillStyle = "#000";
  ctx.fillRect(140, canvas.height - 30, 120, 10);
  const xpRatio = playerStats.xp / playerStats.xpToNext;
  ctx.fillStyle = "#0f0";
  ctx.fillRect(140, canvas.height - 30, 120 * xpRatio, 10);

  if (marketOpen) {
    ctx.fillStyle = "#222";
    ctx.fillRect(100, 100, 440, 200);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(100, 100, 440, 200);

    ctx.fillStyle = "#fff";
    ctx.font = "18px Arial";
    ctx.fillText("MARKET", 280, 130);
    ctx.font = "14px Arial";
    ctx.fillText("Selected crop: " + selectedCrop, 140, 160);
    ctx.fillText("[1] Wheat ($5, seed $3), [2] Corn ($8, seed $5)", 140, 180);
    ctx.fillText("[B] Buy Seed, [S] Sell Crop", 140, 200);
    ctx.fillText("[E] Expand Land (4 tiles, $20)", 140, 220);
    ctx.fillText("[M] Close Market", 140, 240);
  }
}

function unlockMoreLand() {
  let frontier = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (landMap[y][x]) {
        const neighbors = [
          [x - 1, y], [x + 1, y],
          [x, y - 1], [x, y + 1]
        ];
        for (let [nx, ny] of neighbors) {
          if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && !landMap[ny][nx]) {
            frontier.push([nx, ny]);
          }
        }
      }
    }
  }
  let unlocked = 0;
  while (unlocked < 4 && frontier.length > 0) {
    const [ux, uy] = frontier.shift();
    if (!landMap[uy][ux]) {
      landMap[uy][ux] = true;
      unlocked++;
    }
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
