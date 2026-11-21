let image = null;
let balloonPosition = { x: 200, y: 100 };

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const sizeInput = document.getElementById("size");
const tailInput = document.getElementById("tail");
const tailSizeInput = document.getElementById("tail-size");
const tailPosInput = document.getElementById("tail-pos");

// Upload image
document.getElementById("upload").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    image = new Image();
    image.onload = () => {
      balloonPosition = { x: image.width / 2, y: image.height / 3 };
      drawPreview();
    };
    image.src = e.target.result;
  };
  reader.readAsDataURL(file);
  event.target.value = ""; // allows re-selecting the same file
});

// Add text boxes
document.getElementById("add-text").addEventListener("click", () => {
  const container = document.getElementById("texts-container");
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter text";
  input.addEventListener("input", drawPreview); // live text preview
  container.appendChild(input);
  container.appendChild(document.createElement("br"));
});

// Live preview updates
sizeInput.addEventListener("input", drawPreview);
tailInput.addEventListener("change", drawPreview);
tailSizeInput.addEventListener("input", drawPreview);
tailPosInput.addEventListener("input", drawPreview);

// Click sets balloon position (corrected for CSS scaling)
canvas.addEventListener("click", (event) => {
  if (!image) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  balloonPosition.x = (event.clientX - rect.left) * scaleX;
  balloonPosition.y = (event.clientY - rect.top) * scaleY;
  drawPreview();
});

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Split text into lines that fit maxWidth (also breaks overly long words)
function getLines(ctx, text, maxWidth) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
      while (ctx.measureText(line).width > maxWidth && line.length > 1) {
        let i = line.length - 1;
        while (i > 1 && ctx.measureText(line.slice(0, i)).width > maxWidth) i--;
        lines.push(line.slice(0, i));
        line = line.slice(i);
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Fit text into the box: shrink font until it fits
function drawFittedText(ctx, text, x, y, boxWidth, boxHeight) {
  const padding = boxWidth * 0.08;
  const maxWidth = boxWidth - padding * 2;
  const maxHeight = boxHeight - padding * 2;

  let fontSize = Math.round(boxHeight / 4);
  let lines, lineHeight;
  for (; fontSize >= 8; fontSize--) {
    ctx.font = `${fontSize}px Arial`;
    lineHeight = fontSize * 1.2;
    lines = getLines(ctx, text, maxWidth);
    if (lines.length * lineHeight <= maxHeight) break;
  }

  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const startY = y + boxHeight / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x + boxWidth / 2, startY + i * lineHeight));
}

function drawBalloon(ctx, size, includeTail) {
  const boxWidth = size * 2;
  const boxHeight = size * 1.2;
  const radius = 20;

  const tailLen = parseInt(tailSizeInput.value);   // altura do tail
  const tailW = tailLen;                           // largura da base
  const tailPct = parseInt(tailPosInput.value) / 100;

  // Mantém o balão (e o tail) dentro da imagem
  const extra = includeTail ? tailLen : 0;
  const cx = Math.min(Math.max(balloonPosition.x, boxWidth / 2), canvas.width - boxWidth / 2);
  const cy = Math.min(Math.max(balloonPosition.y, boxHeight / 2), canvas.height - boxHeight / 2 - extra);
  const x = cx - boxWidth / 2;
  const y = cy - boxHeight / 2;

  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";

  // Posição do tail ao longo da borda inferior (só na parte reta)
  const minX = x + radius + tailW / 2;
  const maxX = x + boxWidth - radius - tailW / 2;
  const bx = maxX > minX ? minX + (maxX - minX) * tailPct : x + boxWidth / 2;
  const tailY = y + boxHeight;

  if (includeTail) {
    ctx.beginPath();
    ctx.moveTo(bx - tailW / 2, tailY - 2);
    ctx.lineTo(bx + tailW / 4, tailY + tailLen);
    ctx.lineTo(bx + tailW / 2, tailY - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawRoundedRect(ctx, x, y, boxWidth, boxHeight, radius);
  ctx.fill();
  ctx.stroke();

  if (includeTail) {
    // Apaga a linha da borda onde o tail encontra o balão
    ctx.fillStyle = "white";
    ctx.fillRect(bx - tailW / 2 + 2, tailY - 2, tailW - 4, 4);
  }

  return { x, y, boxWidth, boxHeight };
}

function render(text) {
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  const box = drawBalloon(ctx, parseInt(sizeInput.value), tailInput.checked);
  if (text) drawFittedText(ctx, text, box.x, box.y, box.boxWidth, box.boxHeight);
}

function drawPreview() {
  if (!image) return;
  const first = document.querySelector("#texts-container input[type='text']");
  render(first ? first.value.trim() : "");
}

async function generateImages() {
  if (!image) return alert("Please upload an image first!");

  const texts = Array.from(document.querySelectorAll("#texts-container input[type='text']"))
    .map(i => i.value.trim())
    .filter(Boolean);
  if (texts.length === 0) return alert("Please enter at least one text!");

  for (let i = 0; i < texts.length; i++) {
    render(texts[i]);
    const link = document.createElement("a");
    link.download = `output_${i}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    await new Promise(r => setTimeout(r, 300)); // avoid blocked multi-downloads
  }
  drawPreview();
}

document.getElementById("generate").onclick = generateImages;