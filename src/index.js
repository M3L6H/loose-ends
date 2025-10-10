const HEX_BASE = 16;
const PKT_SIZE_BYTE_COUNT = 4;

const td = new TextDecoder('utf-8');

function addLine(line) {
  const textNode = document.createTextNode(line);
  const p = document.createElement('p');
  p.appendChild(textNode);
  document.body.appendChild(p);
}

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
        addLine(`s: ${s}; e: ${e}; line: ${lines[lines.length - 1]}`);
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

function toBytes(str) {
  return Array.from(str).map(c => c.codePointAt(0));
}

function lenToBytes(len) {
  return toBytes(len.toString(HEX_BASE).padStart(PKT_SIZE_BYTE_COUNT, '0'));
}

function createPktLines(lines) {
  const msgLen = lines.reduce((acc, curr) =>
    acc + PKT_SIZE_BYTE_COUNT + curr.length + (curr.length > 0 && curr.endsWith('\n') ? 0 : 1),
  0);
  
  const data = new Uint8Array(msgLen);
  let idx = 0;
  
  for (let line of lines) {
    if (line === '') {
      data.set([0, 0, 0, 0], idx);
      idx += PKT_SIZE_BYTE_COUNT;
      continue;
    }
    
    if (!line.endsWith('\n')) {
      line += '\n';
    }
    
    const len = line.length;
    data.set(lenToBytes(len + PKT_SIZE_BYTE_COUNT), idx);
    idx += PKT_SIZE_BYTE_COUNT;
    
    data.set(toBytes(line), idx);
    idx += len;
    
    addLine(`pkt: msgLen: ${msgLen}; line: ${line}; data: ${data}`);
  }
  
  return data;
}

async function gitReq(url, method='GET', headers={}, body) {
  addLine(`gitReq: url: ${url}; method: ${method}; headers: ${JSON.stringify(headers)}; body: ${body}`);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'git/2.0.0',
      'Accept': '*/*',
      'Git-Protocol': 'version=2',
      ...headers,
    },
    method,
    body,
  });
  
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  
  return await parsePktLines(response.body.getReader());
}

async function getCaps(repo, pat) {
  const capUrl = proxyUrl(`${repo}/info/refs?service=git-upload-pack`);
  const result = await gitReq(capUrl);
  return result;
}

async function lsRefs(repo, pat) {
  const refsUrl = proxyUrl(`${repo}/git-upload-pack`);
  const result = await gitReq(
    refsUrl,
    'POST',
    { 
      'Content-Type': 'application/x-git-upload-pack-request',
    },
    createPktLines([
      'command=ls-refs',
      'peel',
      'symrefs',
      'ref-prefix refs/heads/',
      'ref-prefix refs/tags/',
      '',
    ]),
  );
  
  return result;
}

async function clone(repo, pat='') {
  const capabilities = getCaps(repo, pat);
  console.log('Capabilities:', capabilities);

  return await lsRefs(repo, pat);
}

function init() {
  clone('https://github.com/M3L6H/loose-ends.git')
    .then(lines => lines.forEach(refs => {
      addLine(refs);
    })).catch(err => {
      const textNode = document.createTextNode(err.message);
      document.body.appendChild(textNode);
    });
}

addEventListener('load', () => init());