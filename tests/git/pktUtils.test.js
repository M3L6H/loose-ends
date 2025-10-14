import { parsePktLines } from '@src/git/pktUtils';

describe('pktUtils', () => {
  describe('parsePktLines', () => {
    let data = [];
    const stream = new ReadableStream({
      start(ctrl) {
        data.forEach(ctrl.enqueue);
        ctrl.close();
      },
    });

    beforeEach(() => {
      data = [];
    });

    it('should return empty if the reader is empty', async () => {
      await expect(parsePktLines(stream.getReader())).resolves.toBeEmpty();
    });
    
    it('should read a line', async () => {
      data = [
        // 0 0 0 4 t e s t
        Uint8Array.fromHex('3030303474657374'),
      ];
    
      await expect(parsePktLines(stream.getReader())).resolves.toEqual([
        'test',
      ]);
    });
  });
});
