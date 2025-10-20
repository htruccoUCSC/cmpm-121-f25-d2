import "./style.css";

document.body.innerHTML = `
  <h1>Sticker Sheet</h1>
  <canvas id = "canvas" width="256" height="256"></canvas>
  <div>
    <button id = "clear">Clear</button>
    <button id = "undo">Undo</button>
    <button id = "redo">Redo</button>
  </div>
  <div>
    <button id = "thin" disabled>Thin</button>
    <button id = "thick">Thick</button>
  </div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const clear = document.getElementById("clear") as HTMLButtonElement;
const undo = document.getElementById("undo") as HTMLButtonElement;
const redo = document.getElementById("redo") as HTMLButtonElement;
const thin = document.getElementById("thin") as HTMLButtonElement;
const thick = document.getElementById("thick") as HTMLButtonElement;

let lineWidth = 2;

thin.addEventListener("click", () => {
  lineWidth = 2;
  thin.disabled = true;
  thick.disabled = false;
});

thick.addEventListener("click", () => {
  lineWidth = 4;
  thin.disabled = false;
  thick.disabled = true;
});

const ctx = canvas.getContext("2d")!;

const bus = new EventTarget();

function Notify(eventName: string) {
  bus.dispatchEvent(new Event(eventName));
}

bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("tool-moved", redraw);

interface Point {
  x: number;
  y: number;
}

interface LineCommand {
  points: Point[];
  thickness: number;
  display(ctx: CanvasRenderingContext2D): void;
}

const lineCommands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];

let currentLineCommand: LineCommand | null = null;

interface ToolCommand {
  point: Point;
  thickness: number;
  display(ctx: CanvasRenderingContext2D): void;
}

let currentToolCommand: ToolCommand | null = null;

// function tick() {
//   redraw();
//   requestAnimationFrame(tick);
// }
// tick();

canvas.addEventListener("mousedown", (e) => {
  currentLineCommand = {
    points: [],
    thickness: lineWidth,
    display(ctx: CanvasRenderingContext2D) {
      if (this.points.length > 1) {
        ctx.lineWidth = this.thickness;
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
  currentLineCommand.points.push({ x: e.offsetX, y: e.offsetY });
  Notify("drawing-changed");
});

canvas.addEventListener("mouseup", () => {
  currentLineCommand = null;
  Notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  currentToolCommand!.point = { x: e.offsetX, y: e.offsetY };
  Notify("tool-moved");
  if (e.buttons === 1) {
    currentLineCommand?.points.push({ x: e.offsetX, y: e.offsetY });
    Notify("drawing-changed");
  }
});

canvas.addEventListener("mouseout", () => {
  currentToolCommand = null;
  Notify("tool-moved");
});

canvas.addEventListener("mouseenter", (e) => {
  currentToolCommand = {
    point: { x: e.offsetX, y: e.offsetY },
    thickness: lineWidth,
    display(ctx: CanvasRenderingContext2D) {
      ctx.lineWidth = this.thickness;
      ctx.beginPath();
      ctx.arc(this.point.x, this.point.y, this.thickness / 4, 0, Math.PI * 2);
      ctx.stroke();
    },
  };
  Notify("tool-moved");
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

  if (currentToolCommand) {
    currentToolCommand.display(ctx);
  }
}
