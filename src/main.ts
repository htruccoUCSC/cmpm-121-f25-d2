import "./style.css";

document.body.innerHTML = `
  <h1>Sticker Sheet</h1>
  <canvas id = "canvas" width="256" height="256"></canvas>
  <button id = "clear">Clear</button>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const clear = document.getElementById("clear") as HTMLButtonElement;

const ctx = canvas.getContext("2d")!;

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    ctx.beginPath();
    ctx.moveTo(cursor.x, cursor.y);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
  }
});

clear.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
