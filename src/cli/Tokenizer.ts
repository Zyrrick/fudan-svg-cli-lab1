export class Tokenizer {
  tokenize(line: string): string[] {
    if (line.trimStart().startsWith('#')) return [];
    const tokens: string[] = []; let index = 0;
    while (index < line.length) {
      if (/\s/u.test(line[index]!)) { index++; continue; }
      let token = '';
      if (line[index] === '"') {
        index++; let closed = false;
        while (index < line.length) {
          const character = line[index++]!;
          if (character === '"') { closed = true; break; }
          if (character === '\\') {
            const next = line[index++];
            if (next === undefined || !['"', '\\'].includes(next)) throw new Error('quoted escapes must be \\" or \\\\');
            token += next;
          } else token += character;
        }
        if (!closed) throw new Error('unterminated double quote');
        if (index < line.length && !/\s/u.test(line[index]!)) throw new Error('expected whitespace after quoted argument');
      } else {
        while (index < line.length && !/\s/u.test(line[index]!)) {
          const character = line[index++]!;
          if (character === '"') throw new Error('double quote must begin an argument');
          token += character;
        }
      }
      tokens.push(token);
    }
    return tokens;
  }
}
