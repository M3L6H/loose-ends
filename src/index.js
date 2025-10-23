import { pktUtils } from './git/index.js';

function addLine(line) {
  const textNode = document.createTextNode(line);
  const p = document.createElement('p');
  p.appendChild(textNode);
  document.body.appendChild(p);
}

function proxyUrl(url) {
  return `https://corsproxy.io?url=${encodeURIComponent(url)}`;
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
    throw new Error(`ERROR: Status: ${response.status}; Body: ${await response.text()}`);
  }
  
  return await pktUtils.parsePktLines(response.body.getReader());
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
    pktUtils.createPktLines([
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
  capabilities.forEach(cap => {
    addLine(cap);
  });

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