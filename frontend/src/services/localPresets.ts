// 预设背景动态生成（Canvas API）

// 纯色背景
export function renderColorBg(hex: string, width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, width, height);
  return canvas.toDataURL('image/png');
}

// 纹理背景
export function renderTextureBg(
  textureType: string,
  width: number,
  height: number,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const rand = seededRandom(42);

  switch (textureType) {
    case 'kraft': {
      ctx.fillStyle = '#D2B48C';
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < 20000; i++) {
        const x = rand() * width;
        const y = rand() * height;
        const noise = (rand() - 0.5) * 40;
        ctx.fillStyle = `rgb(${clamp(210 + noise)}, ${clamp(180 + noise)}, ${clamp(140 + noise)})`;
        ctx.fillRect(x, y, 1, 1);
      }
      break;
    }
    case 'grid': {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#E8E8E8';
      ctx.lineWidth = 1;
      const gs = 40;
      for (let x = 0; x < width; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      break;
    }
    case 'watercolor': {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < 500; i++) {
        const x = rand() * width;
        const y = rand() * height;
        const r = 100 + rand() * 155;
        const g = 100 + rand() * 155;
        const b = 150 + rand() * 105;
        const radius = 30 + rand() * 90;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.04)`;
        ctx.beginPath();
        ctx.ellipse(x, y, radius, radius, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'fabric': {
      ctx.fillStyle = '#F5F0EB';
      ctx.fillRect(0, 0, width, height);
      for (let y = 0; y < height; y += 4) {
        for (let x = 0; x < width; x += 4) {
          if ((x + y) % 8 === 0) {
            ctx.fillStyle = '#E8E0D5';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      ctx.strokeStyle = '#EDE5DD';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 6) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 6) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      break;
    }
    case 'wood': {
      ctx.fillStyle = '#DEB887';
      ctx.fillRect(0, 0, width, height);
      for (let y = 0; y < height; y += 3) {
        const shade = (rand() - 0.5) * 30;
        ctx.strokeStyle = `rgb(${clamp(222 + shade)}, ${clamp(184 + shade)}, ${clamp(135 + shade)})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      break;
    }
    case 'marble': {
      ctx.fillStyle = '#F0F0F0';
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < 2000; i++) {
        const x = rand() * width;
        const y = rand() * height;
        const shade = 200 - rand() * 60;
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        ctx.beginPath();
        ctx.ellipse(x, y, 50, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'dots': {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#D0D0D0';
      const spacing = 30;
      for (let x = spacing; x < width; x += spacing) {
        for (let y = spacing; y < height; y += spacing) {
          ctx.beginPath();
          ctx.ellipse(x, y, 2, 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'squares': {
      ctx.fillStyle = '#FFFFF0';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#B0D0FF';
      ctx.lineWidth = 1;
      const sq = 25;
      for (let x = 0; x < width; x += sq) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += sq) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      break;
    }
    case 'lines': {
      ctx.fillStyle = '#FFFFF0';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#B0D0FF';
      ctx.lineWidth = 1;
      const ls = 30;
      for (let y = ls; y < height; y += ls) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      break;
    }
    case 'blank':
    default: {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      break;
    }
  }

  return canvas.toDataURL('image/png');
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}