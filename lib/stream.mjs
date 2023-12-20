import { get } from "node:https";
import { load } from "cheerio";
export default () => new Promise((resolve, reject) => {
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
            const streams = [];
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
                if (typeof stream.name === "string" &&
                    typeof stream.link === "string" &&
                    typeof stream.url === "string")
                    streams.push(stream);
            });
            if (streams.length === 0)
                reject("No channels found, website has probably updated");
            else
                resolve(streams);
        });
    }).end();
});
