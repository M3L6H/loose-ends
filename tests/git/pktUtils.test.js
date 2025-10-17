import { createPktLines, parsePktLines } from '@src/git/pktUtils';

describe('pktUtils', () => {
  describe('parsePktLines', () => {
    it('should return empty if the reader is empty', async () => {
      const stream = new ReadableStream({
        start(ctrl) {
          ctrl.close();
        },
      });

      await expect(parsePktLines(stream.getReader())).resolves.toBeEmpty();
    });

    it('should read a line', async () => {
      const data = [
        // 0 0 0 8 t e s t
        Uint8Array.fromHex('3030303874657374'),
      ];
      
      const stream = new ReadableStream({
        start(ctrl) {
          data.forEach(d => ctrl.enqueue(d));
          ctrl.close();
        },
      });

      await expect(parsePktLines(stream.getReader())).resolves.toEqual([
        'test',
      ]);
    });
    
    it('should read a line over multiple chunks', async () => {
      const data = [
        // 0 0
        Uint8Array.fromHex('3030'),
        // 0 8 t
        Uint8Array.fromHex('303874'),
        // e s
        Uint8Array.fromHex('6573'),
        // t
        Uint8Array.fromHex('74'),
      ];
      
      const stream = new ReadableStream({
        start(ctrl) {
          data.forEach(d => ctrl.enqueue(d));
          ctrl.close();
        },
      });

      await expect(parsePktLines(stream.getReader())).resolves.toEqual([
        'test',
      ]);
    });
    
    it('should flush when length is 0', async () => {
      const data = [
        // 0 0 0 8 t e s t
        Uint8Array.fromHex('3030303874657374'),
        // 0 0 0 0
        Uint8Array.fromHex('30303030'),
        // 0 0 0 f a b c d
        Uint8Array.fromHex('3030306661626364'),
        // e f g h i j k
        Uint8Array.fromHex('65666768696a6b'),
      ];
      
      const stream = new ReadableStream({
        start(ctrl) {
          data.forEach(d => ctrl.enqueue(d));
          ctrl.close();
        },
      });

      await expect(parsePktLines(stream.getReader())).resolves.toEqual([
        'test',
        'abcdefghijk',
      ]);
    });
  });
  
  describe('createPktLines', () => {
    it('should return empty for empty array', () => {
      expect(createPktLines([])).toHaveLength(0);
    });
  });
});
