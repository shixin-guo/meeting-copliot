const transcriptLines: string[] = [];

// const canvas = document.getElementById('dataCanvas') as HTMLCanvasElement;
// const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
// const maxLines = 20;
// const lineHeight = 42;

// canvas.width = 1000;
// canvas.height = maxLines * lineHeight;

// ctx.font = '30px Arial';
// ctx.textBaseline = 'top';
// ctx.fillStyle = 'black';

// function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
//   const words = text.split(' ');
//   let line = '';
//   for (let n = 0; n < words.length; n++) {
//     const testLine = line + words[n] + ' ';
//     const metrics = ctx.measureText(testLine);
//     const testWidth = metrics.width;
//     if (testWidth > maxWidth && n > 0) {
//       ctx.fillText(line, x, y);
//       line = words[n] + ' ';
//       y += lineHeight;
//     } else {
//       line = testLine;
//     }
//   }
//   ctx.fillText(line, x, y);
//   return y + lineHeight;
// }

const socket = new WebSocket("ws://localhost:3000/ws");

socket.onopen = () => {
  console.log("✅ WebSocket connected");
};

socket.onmessage = (event) => {
  try {
    const msg = JSON.parse(event.data);

    if (msg.type === "transcript") {
      const line = `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.user}: ${msg.content}`;
      transcriptLines.push(line);

      for (const line of transcriptLines) {
        console.log(line);
      }
    }
  } catch (err: unknown) {
    console.warn("Non-JSON or invalid message:", event.data);
  }
};

socket.onerror = (err) => {
  console.error("WebSocket error:", err);
};

socket.onclose = () => {
  console.warn("WebSocket connection closed");
};
