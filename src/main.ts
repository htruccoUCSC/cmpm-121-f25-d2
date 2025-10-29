import "./style.css";

const availableEmojis: string[] = ["💩", "🤠", "😭"];

document.body.innerHTML = `
  <h1>Sticker Sheet</h1>
  <canvas id = "canvas" width="256" height="256"></canvas>
  <div>
    <button id = "clear">Clear</button>
    <button id = "undo">Undo</button>
    <button id = "redo">Redo</button>
    <button id = "add-sticker">Add Sticker</button>
  </div>
  <div>
    <button id = "thin" disabled>Thin</button>
    <button id = "thick">Thick</button>
    <button id = "color">Color</button>
  </div>
  <div id="emoji-container"></div>
  <div><button id="export">Export</button></div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const clear = document.getElementById("clear") as HTMLButtonElement;
const undo = document.getElementById("undo") as HTMLButtonElement;
const redo = document.getElementById("redo") as HTMLButtonElement;
const thin = document.getElementById("thin") as HTMLButtonElement;
const thick = document.getElementById("thick") as HTMLButtonElement;
const color = document.getElementById("color") as HTMLButtonElement;
const addSticker = document.getElementById("add-sticker") as HTMLButtonElement;
const exportButton = document.getElementById("export") as HTMLButtonElement;

let lineWidth: number | null = 2;
let markerColor: string = "#000000";
let currentEmoji: string | null = null;

let lastActiveButton: HTMLButtonElement = thin;

function setActiveButton(btn: HTMLButtonElement) {
  lastActiveButton.disabled = false;
  if (btn) {
    btn.disabled = true;
  }
  lastActiveButton = btn;
}

thin.addEventListener("click", () => {
  currentEmoji = null;
  lineWidth = 2;
  setActiveButton(thin);
});

thick.addEventListener("click", () => {
  currentEmoji = null;
  lineWidth = 6;
  setActiveButton(thick);
});

color.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "color";
  input.value = markerColor || "#000000";
  input.style.position = "fixed";
  input.style.left = "-9999px";
  document.body.appendChild(input);

  const onInput = (e: Event) => {
    const v = (e.target as HTMLInputElement).value;
    markerColor = v;
  };

  input.addEventListener("input", onInput);
  input.addEventListener("change", () => {
    input.removeEventListener("input", onInput);
    if (input.parentElement) input.parentElement.removeChild(input);
  });

  input.click();
});

function renderEmojiButtons() {
  const container = document.getElementById(
    "emoji-container",
  ) as HTMLDivElement;
  if (!container) return;
  container.innerHTML = availableEmojis
    .map((item) => `<button class="emoji">${item}</button>`)
    .join("");

  const buttons = Array.from(
    container.querySelectorAll(".emoji"),
  ) as HTMLButtonElement[];
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveButton(btn);
      currentEmoji = btn.textContent || null;
      lineWidth = null;
    });
  });
}

renderEmojiButtons();

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
  thickness?: number | null;
  color?: string | null;
  emoji?: string | null;
  display(ctx: CanvasRenderingContext2D): void;
}

const lineCommands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];

let currentLineCommand: LineCommand | null = null;

interface ToolCommand {
  point: Point;
  thickness?: number | null;
  color?: string | null;
  emoji?: string | null;
  display(ctx: CanvasRenderingContext2D): void;
}

let currentToolCommand: ToolCommand | null = null;

canvas.addEventListener("mousedown", (e) => {
  currentLineCommand = {
    points: [],
    thickness: lineWidth,
    color: markerColor,
    emoji: currentEmoji,
    display(ctx: CanvasRenderingContext2D) {
      if (this.thickness && this.color) {
        if (this.points.length > 1) {
          ctx.lineWidth = this.thickness;
          ctx.strokeStyle = this.color;
          ctx.beginPath();
          const { x, y } = this.points[0];
          ctx.moveTo(x, y);
          for (const { x, y } of this.points) {
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (this.emoji) {
        if (this.points.length) {
          const p = this.points[this.points.length - 1];
          ctx.font = "24px serif";
          ctx.fillText(this.emoji, p.x - 8, p.y + 16);
        }
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
    color: markerColor,
    emoji: currentEmoji,
    display(ctx: CanvasRenderingContext2D) {
      if (this.thickness && this.color) {
        ctx.lineWidth = this.thickness;
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.point.x, this.point.y, this.thickness / 4, 0, Math.PI * 2);
        ctx.stroke();
      } else if (this.emoji) {
        ctx.font = "24px serif";
        ctx.fillText(this.emoji, this.point.x - 8, this.point.y + 16);
      }
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

addSticker.addEventListener("click", () => {
  const text = prompt("Custom sticker text", "🧽");
  if (text && text.trim().length > 0) {
    const sticker = text.trim();
    availableEmojis.push(sticker);
    renderEmojiButtons();

    const container = document.getElementById(
      "emoji-container",
    ) as HTMLDivElement;
    const buttons = container.querySelectorAll(".emoji");
    const newBtn = buttons[buttons.length - 1] as HTMLButtonElement | undefined;
    if (newBtn) {
      setActiveButton(newBtn);
      currentEmoji = sticker;
      lineWidth = null;
    }
  }
});

exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d")!;
  exportCtx.scale(4, 4);
  lineCommands.forEach((line) => line.display(exportCtx));
  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = "sticker-sheet.png";
  anchor.click();
});

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lineCommands.forEach((line) => line.display(ctx));

  if (currentToolCommand) {
    currentToolCommand.display(ctx);
  }
}
