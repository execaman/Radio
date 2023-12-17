import { get } from "node:https";
import { load } from "cheerio";
import type { Stream } from "./config.mjs";

class Queue<Item = any> {
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

export default () =>
  new Promise<Queue<Stream>>((resolve, reject) => {
    get("https://ilovemusic.de/streams", (response) => {
      response.setEncoding("utf-8");
      let data = "";
      response
        .on("data", (buffer) => {
          data += buffer;
        })
        .once("error", reject)
        .once("end", () => {
          const $ = load(data);
          const streams: Stream[] = [];
          $("#content .boxcontent").each((index, element) => {
            const element_info = $(element);
            const stream = {
              name: element_info.find("h1").text().trim(),
              link: (() => {
                const url = element_info.find("a:first-child").attr("href");
                return url && url.slice(0, url.lastIndexOf("."));
              })(),
              url: element_info.find("a:last-child").attr("href"),
            };
            if (
              typeof stream.name === "string" &&
              typeof stream.link === "string" &&
              typeof stream.url === "string"
            )
              streams.push(stream as Stream);
          });
          if (streams.length === 0) reject();
          else resolve(new Queue(streams));
        });
    }).end();
  });
