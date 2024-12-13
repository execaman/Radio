export class Queue<Item> {
  items: Item[];
  index: number = 0;

  constructor(items: Item[]) {
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
    return this.items[--this.index];
  }

  get currentItem() {
    return this.items[this.index];
  }

  get nextItem() {
    if (!this.next) return;
    return this.items[++this.index];
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
