const HEX_BASE = 16;
const PKT_SIZE_BYTE_COUNT = 4;

const td = new TextDecoder('utf-8');

/**
 * Parses the git pkt-line format from a ReadableStream reader.
 *
 * @param {ReadableStreamDefaultReader} reader - byte stream reader
 *
 * @returns {string[]} Array of lines
 */
export async function parsePktLines(reader) {
  const lines = [];
  let len = null;
  let s = e = 0;
  const curr = new Uint8Array(0xffff);
  
  while (true) {
    const { done, value } = await reader.read();
    
    if (done) break;

    for (let i = 0; i < value.length;) {
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

/**
 * Converts an array of lines into the git pkt-line format. Empty strings become null bytes.
 *
 * @param {string[]} lines - array of lines
 *
 * @returns {Uint8Array} Array of byted
 */
export function createPktLines(lines) {
  const msgLen = lines.reduce((acc, curr) =>
    acc + PKT_SIZE_BYTE_COUNT + curr.length + (curr.length === 0 || curr.endsWith('\n') ? 0 : 1),
  0);
  
  const data = new Uint8Array(msgLen);
  let idx = 0;
  
  for (const line of lines) {
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
  }
  
  return data;
}

function toBytes(str) {
  return Array.from(str).map(c => c.codePointAt(0));
}

function lenToBytes(len) {
  return toBytes(len.toString(HEX_BASE).padStart(PKT_SIZE_BYTE_COUNT, '0'));
}