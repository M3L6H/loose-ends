import { parsePktLines } from '@src/git/pktUtils';

describe('pktUtils', () => {
  describe('parsePktLines', () => {
    it('should return empty if the reader is empty', () => {
      const stream = new ReadableStream({
        start(controller) {
          // Close stream immediately
          controller.close();
        },
      });

      expect(parsePktLines(stream.getReader())).toBeEmpty();
    });
  });
});
