function parsePktLines(data) {
  const lines = [];
  let pos = 0;
  const buffer = Buffer.from(data);

  while (pos < buffer.length) {
    if (pos + 4 > buffer.length) break;
  
    const lenHex = buffer.slice(pos, pos + 4).toString('utf8');
    const len = parseInt(lenHex, 16);
  
    if (len === 0) {
      pos += 4;
      continue; // Flush line
    }
  
    if (pos + len > buffer.length) break;
  
    const line = buffer.slice(pos + 4, pos + len).toString('utf8').trim();
  
    if (line) lines.push(line);
  
    pos += len;
  }

  return lines;
}

function createPktLine(str) {
  const len = Buffer.byteLength(str) + 4 + (str.endsWith('\n') ? 0 : 1); // Add \n if missing
  const lenHex = len.toString(16).padStart(4, '0');
  return Buffer.from(lenHex + (str.endsWith('\n') ? str : str + '\n'));
}

function createFlush() {
  return Buffer.from('0000');
}

function proxyUrl(url) {
  return `https://corsproxy.io?url=${encodeURIComponent(url)}`;
}

async function clone(repo, pat='') {
  const uploadPackUrl = proxyUrl(`${repo}/info/refs?service=git-upload-pack`);

  const response = await fetch(uploadPackUrl, {
    headers: {
      'Git-Protocol': 'version=2',
    },
  });
    
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }

  const result = await response.text();

  return parsePktLines(result);
}

function init() {
  clone('https://github.com/M3L6H/loose-ends.git')
    .then(lines => lines.forEach(refs => {
      const textNode = document.createTextNode(refs);
      document.body.appendChild(textNode);
    })).catch(err => {
      const textNode = document.createTextNode(err.message);
      document.body.appendChild(textNode);
    });
}

addEventListener('load', () => init());