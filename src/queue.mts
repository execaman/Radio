export default class Queue<Item = any> {
  data: Item[];
  index: number;
  constructor(items: Item[]) {
    this.data = items;
    this.index = 0;
  }
  get previous() {
    return this.index !== 0;
  }
  get next() {
    return this.index !== this.data.length - 1;
  }
  get firstItem() {
    if (this.index === 0) return;
    return this.data[(this.index = 0)];
  }
  get previousItem() {
    if (!this.previous) return;
    return this.data[(this.index -= 1)];
  }
  get currentItem() {
    return this.data[this.index];
  }
  get nextItem() {
    if (!this.next) return;
    return this.data[(this.index += 1)];
  }
  get lastItem() {
    if (!this.next) return;
    return this.data[(this.index = this.data.length - 1)];
  }
  get randomItem() {
    return this.data[
      (this.index = Math.floor(Math.random() * this.data.length))
    ];
  }
  jump(index: number) {
    if (index < 0 || index >= this.data.length) return;
    return this.data[(this.index = index)];
  }
}
