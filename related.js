const axios = require('axios');
const fs = require('fs');

function create_data(pin_id, bookmark=false) {
  if (bookmark !== false) {
    return JSON.stringify({
                           "options": {
                             "pin_id": pin_id.toString(),
                             "context_pin_ids": [
                               pin_id.toString()
                             ],
                             "page_size": 50,
                             "search_query": "",
                             "source": "pin",
                             "top_level_source": "deep_linking",
                             "top_level_source_depth": 2,
                             "is_pdp": false,
                             "bookmarks": [bookmark]
                           },
                           "context": {}
                         })
  } else {
    return JSON.stringify({
      "options": {
        "pin_id": pin_id.toString(),
        "context_pin_ids": [
          pin_id.toString()
        ],
        "page_size": 25,
        "search_query": "",
        "source": "pin",
        "top_level_source": "deep_linking",
        "top_level_source_depth": 2,
        "is_pdp": false,
      },
      "context": {}
    })
  }
}

async function get_related(pin_id, bookmark = false) {
  const gen_data = (bookmark !== false) ? create_data(pin_id, bookmark) : create_data(pin_id);
  const response = await axios.get(`https://id.pinterest.com/resource/RelatedModulesResource/get/?source_url=/pin/${pin_id}/&data=${gen_data}&_=1719418593610`, {
    headers: {
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'id,en;q=0.9,id-ID;q=0.8,en-US;q=0.7,zh-CN;q=0.6,zh;q=0.5',
      'cache-control': 'max-age=0',
      'cookie': '_b="qwerty"; _derived_epik=qwerty; __Secure-s_a=qwerty"; _routing_id="3aae3f88-5d4c-4a50-ac3f-083c8ee2fe07"; sessionFunnelEventLogged=1',
      'priority': 'u=0, i',
      'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
      'sec-ch-ua-full-version-list': '"Not/A)Brand";v="8.0.0.0", "Chromium";v="126.0.6478.126", "Google Chrome";v="126.0.6478.126"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-model': '""',
      'sec-ch-ua-platform': '"Windows"',
      'sec-ch-ua-platform-version': '"15.0.0"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'service-worker-navigation-preload': 'true',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    }
  });
  
  return {res: response.data?.resource_response?.data, bookmark: response.data?.resource_response?.bookmark};
}

async function crawler(pin_id) {
  let save = [];
  let output_file = `./pinterest/sample.json`;
  if (fs.existsSync(output_file)) {
    save = save.concat(JSON.parse(fs.readFileSync(output_file)))
    console.log('concate old data to new one')
  }
  console.log('total items:', save.length)
  let bookmark_id = false;

  const loops = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  for (let _ of loops) {
    const related = await get_related(pin_id, bookmark_id);
    if (related.bookmark !== false) { bookmark_id = related.bookmark }

    for (let items of related.res) {
      if (items?.type === 'pin' && items?.images?.orig != undefined) {
        let item_to_push = items.images.orig
        item_to_push.id = items.id
        save.push(item_to_push)
      }
    }
    save = save.filter(function(elem, pos) {
        return save.indexOf(elem) == pos;
    });
    console.log(`[${_}] total ${save.length} images in container right now`);
    fs.writeFileSync(output_file, JSON.stringify(save, null, 4));
  }
}

async function get_pin(sh) {
  try {
    const asu = await axios.head(sh, {
      maxRedirects: 2
    });
    return asu.request.path.split('/')[2]
  } catch (x) {
    return false;
  }
};

/** by short */
const pins = [
  "https://pin.it/3L21b0Pj5",
  "https://pin.it/1pUoI6jlL",
  "https://pin.it/6eloSzMCE",
  "https://pin.it/7uqvKfh42",
  "https://pin.it/1DIeybLoM",
  "https://pin.it/4tZpRsdb0",
  "https://pin.it/6e2qjMKar",
  "https://pin.it/38U7wJUeD",
  "https://pin.it/3FRjSOk8J",
  "https://pin.it/29CtGuftZ",
  "https://pin.it/3XDMms52p",
  "https://pin.it/2wc4XqDA3",
  "https://pin.it/27E2aQxVX",
  "https://pin.it/5rRBstj3x",
  "https://pin.it/7dHNUcv6U",
  "https://pin.it/1ZeOiHKOO",
  "https://pin.it/2gfywxG8U"
]

async function main() {
  let index = 0;
  for (let pin of pins) {
    console.log(`[${index++}] ${pin}`);
    const pin_id = await get_pin(pin);
    if (pin_id !== false) {
      await crawler(pin_id);
    } else {
      console.log(`[404] ${pin}`)
    }
  }
}

/** by pin */
const pinids = [
  "492649952550877",
  "249457266852811641",
  "579275570848791508",
  "13159023904547693",
  "17381148555801271",
  "14003448835693504",
  "211174976944230",
  "18014467255301326",
  "67483694409443638",
  "6966574418201925",
  "6333255722633148",
  "44050902597960182",
  "34128909670578014",
  "10555380369854834"
]

async function bypin() {
  let index = 0;
  for (let pin of pinids) {
    console.log(`[${index++}] ${pin}`);
    if (pin !== "") {
      await crawler(pin);
    } else {
      console.log(`[404] ${pin}`)
    }
  }
}

bypin();
