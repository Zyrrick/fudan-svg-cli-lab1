export interface FilePort {
  read(path: string): string;
  write(path: string, content: string): void;
}
