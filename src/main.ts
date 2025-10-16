import "./style.css";

document.body.innerHTML = `
  <h1>Sticker Sheet</h1>
  <canvas id = "canvas" width="256" height="256"></canvas>
  <button id = "clear">Clear</button>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const clear = document.getElementById("clear") as HTMLButtonElement;

const ctx = canvas.getContext("2d")!;

const bus = new EventTarget();

function Notify(eventName: string) {
  bus.dispatchEvent(new Event(eventName));
}

bus.addEventListener("drawing-changed", redraw);

interface Point {
  x: number;
  y: number;
}
const lines: Point[][] = [];

let currentLine: Point[] | null = null;

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLine = [];
  lines.push(currentLine);
  currentLine.push({ x: cursor.x, y: cursor.y });
  Notify("drawing-changed");
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLine = null;
  Notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLine?.push({ x: cursor.x, y: cursor.y });
    Notify("drawing-changed");
  }
});

clear.addEventListener("click", () => {
  lines.splice(0, lines.length);
  Notify("drawing-changed");
});

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const line of lines) {
    if (line.length > 1) {
      ctx.beginPath();
      const { x, y } = line[0];
      ctx.moveTo(x, y);
      for (const { x, y } of line) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}
