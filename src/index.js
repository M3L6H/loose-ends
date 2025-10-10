const HEX_BASE = 16;
const PKT_SIZE_BYTE_COUNT = 4;

const td = new TextDecoder('utf-8');

async function parsePktLines(reader) {
  const lines = [];
  let len = null;
  let s = e = 0;
  const curr = new Uint8Array(0xffff);
  
  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    for (let i = 0; i < value.length; i += 0) {
      const chunk = value.subarray(i, i + e - s + (len ?? PKT_SIZE_BYTE_COUNT));
      curr.set(chunk, e);
      e += chunk.length;
      i += chunk.length;

      if (len === null) {
        if (e - s < PKT_SIZE_BYTE_COUNT) continue;
        const d = curr.subarray(s, s + PKT_SIZE_BYTE_COUNT);
        s += PKT_SIZE_BYTE_COUNT;
        len = parseInt(td.decode(d), HEX_BASE) - PKT_SIZE_BYTE_COUNT;
      }

      if (len > 0) {
        if (e - s < len) continue;
    
        const d = curr.subarray(s, s + len);
        s += len;
        lines.push(td.decode(d).trim());
      }

      // Flush
      const d = curr.subarray(s, e);
      curr.set(d, 0);
      e -= s;
      s = 0;
      len = null;
    }
  }

  return lines;
}

function proxyUrl(url) {
  return `https://corsproxy.io?url=${encodeURIComponent(url)}`;
}

async function clone(repo, pat='') {
  const uploadPackUrl = proxyUrl(`${repo}/info/refs?service=git-upload-pack`);

  const response = await fetch(uploadPackUrl, {
    headers: {
      'User-Agent': 'git/2.0.0',
      'Accept': '*/*',
      'Git-Protocol': 'version=2',
    },
  });

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }

  const result = await parsePktLines(response.body.getReader());

  return result;
}

function init() {
  clone('https://github.com/M3L6H/loose-ends.git')
    .then(lines => lines.forEach(refs => {
      const textNode = document.createTextNode(refs);
      const p = document.createElement('p');
      p.appendChild(textNode);
      document.body.appendChild(p);
    })).catch(err => {
      const textNode = document.createTextNode(err.message);
      document.body.appendChild(textNode);
    });
}

addEventListener('load', () => init());