export class Queue<Item = any> {
  index: number = 0;
  items: Item[] = null!;

  constructor(items: Item[] = []) {
    if (!Array.isArray(items))
      throw new TypeError(`Expected an array of items, got '${typeof items}'`);
    this.items = items;
  }

  get previous() {
    return this.index > 0;
  }

  get next() {
    return this.index < this.items.length - 1;
  }

  get firstItem() {
    return this.items[(this.index = 0)];
  }

  get previousItem() {
    if (!this.previous) return;
    return this.items[(this.index -= 1)];
  }

  get currentItem() {
    return this.items[this.index];
  }

  get nextItem() {
    if (!this.next) return;
    return this.items[(this.index += 1)];
  }

  get lastItem() {
    if (this.items.length === 0) return;
    return this.items[(this.index = this.items.length - 1)];
  }

  get randomItem() {
    if (this.items.length === 0) return;
    return this.items[(this.index = Math.floor(Math.random() * this.items.length))];
  }
}
