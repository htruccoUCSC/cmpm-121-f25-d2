import "./style.css";

document.body.innerHTML = `
  <h1>Sticker Sheet</h1>
  <canvas id = "canvas" width="256" height="256"></canvas>
  <div>
    <button id = "clear">Clear</button>
    <button id = "undo">Undo</button>
    <button id = "redo">Redo</button>
  </div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const clear = document.getElementById("clear") as HTMLButtonElement;
const undo = document.getElementById("undo") as HTMLButtonElement;
const redo = document.getElementById("redo") as HTMLButtonElement;

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

interface LineCommand {
  points: Point[];
  display(ctx: CanvasRenderingContext2D): void;
}

const lineCommands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];

let currentLineCommand: LineCommand | null = null;

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentLineCommand = {
    points: [],
    display(ctx: CanvasRenderingContext2D) {
      if (this.points.length > 1) {
        ctx.beginPath();
        const { x, y } = this.points[0];
        ctx.moveTo(x, y);
        for (const { x, y } of this.points) {
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
  };
  lineCommands.push(currentLineCommand);
  redoCommands.splice(0, redoCommands.length);
  currentLineCommand.points.push({ x: cursor.x, y: cursor.y });
  Notify("drawing-changed");
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
  currentLineCommand = null;
  Notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentLineCommand?.points.push({ x: cursor.x, y: cursor.y });
    Notify("drawing-changed");
  }
});

clear.addEventListener("click", () => {
  lineCommands.splice(0, lineCommands.length);
  Notify("drawing-changed");
});

undo.addEventListener("click", () => {
  if (lineCommands.length > 0) {
    redoCommands.push(lineCommands.pop()!);
    Notify("drawing-changed");
  }
});

redo.addEventListener("click", () => {
  if (redoCommands.length > 0) {
    lineCommands.push(redoCommands.pop()!);
    Notify("drawing-changed");
  }
});

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lineCommands.forEach((line) => line.display(ctx));
}
