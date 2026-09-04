let image = null; 
let balloonPosition = { x: 200, y: 100 }; 

// Upload image
document.getElementById("upload").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      image = new Image();
      image.onload = () => drawPreview();
      image.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Add text boxes
document.getElementById("add-text").addEventListener("click", () => {
  const container = document.getElementById("texts-container");
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter text";
  container.appendChild(input);
  container.appendChild(document.createElement("br"));
});

// Capture click for balloon position
document.getElementById("canvas").addEventListener("click", (event) => {
  const canvas = event.target;
  const rect = canvas.getBoundingClientRect();
  balloonPosition.x = event.clientX - rect.left;
  balloonPosition.y = event.clientY - rect.top;
  drawPreview();
});

// Draw rounded rectangle
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Wrap and center text
function wrapText(ctx, text, x, y, maxWidth, lineHeight, boxHeight) {
  const words = text.split(" ");
  let line = "";
  const lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  const totalHeight = lines.length * lineHeight;
  let startY = y + (boxHeight - totalHeight) / 2 + lineHeight;

  lines.forEach(l => {
    const lineWidth = ctx.measureText(l).width;
    ctx.fillText(l.trim(), x + (maxWidth - lineWidth) / 2, startY);
    startY += lineHeight;
  });
}

// Draw balloon
function drawBalloon(ctx, size, includeTail) {
  const boxWidth = size * 2;
  const boxHeight = size * 1.2;
  const x = balloonPosition.x - boxWidth / 2;
  const y = balloonPosition.y - boxHeight / 2;

  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, x, y, boxWidth, boxHeight, 20);
  ctx.fill();
  ctx.stroke();

  if (includeTail) {
    ctx.beginPath();
    ctx.moveTo(balloonPosition.x, y + boxHeight);
    ctx.lineTo(balloonPosition.x + 20, y + boxHeight + 40);
    ctx.lineTo(balloonPosition.x + 40, y + boxHeight);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  return { x, y, boxWidth, boxHeight };
}

// Preview
function drawPreview() {
  if (!image) return;
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0);

  const size = parseInt(document.getElementById("size").value);
  drawBalloon(ctx, size, document.getElementById("tail").checked);
}

// Generate images
function generateImages() {
  if (!image) {
    alert("Please upload an image first!");
    return;
  }

  const inputs = document.querySelectorAll("#texts-container input[type='text']");
  const texts = Array.from(inputs).map(i => i.value.trim()).filter(t => t.length > 0);

  if (texts.length === 0) {
    alert("Please enter at least one text!");
    return;
  }

  const includeTail = document.getElementById("tail").checked;
  const size = parseInt(document.getElementById("size").value);
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  texts.forEach((text, i) => {
    canvas.width = image.width;
    canvas.height = image.height;

    ctx.drawImage(image, 0, 0);
    const { x, y, boxWidth, boxHeight } = drawBalloon(ctx, size, includeTail);

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    wrapText(ctx, text, x, y, boxWidth, 24, boxHeight);

    const link = document.createElement("a");
    link.download = `output_${i}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

document.getElementById("generate").onclick = generateImages;
