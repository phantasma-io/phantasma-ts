import { IStack } from "../interfaces/index.js";

export class Stack<T> implements IStack<T> {
  private storage: T[] = [];

  constructor(private capacity: number = Infinity) {}

  push(item: T): void {
    if (this.size() === this.capacity) {
      throw Error("Stack has reached max capacity, you cannot add more items");
    }
    this.storage.push(item);
  }

  pop(): T | undefined {
    return this.storage.pop();
  }

  peek(): T | undefined {
    return this.storage[this.size() - 1];
  }

  size(): number {
    return this.storage.length;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  toArray(): T[] {
    return this.storage;
  }

  clear(): void {
    this.storage = [];
  }

  toString(): string {
    return this.storage.toString();
  }

  isFull(): boolean {
    return this.capacity === this.size();
  }
}
