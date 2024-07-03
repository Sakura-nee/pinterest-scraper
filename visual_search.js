const axios = require("axios");
const fs = require("fs");

const headers = {
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'accept-language': 'id,en;q=0.9,id-ID;q=0.8,en-US;q=0.7,zh-CN;q=0.6,zh;q=0.5',
  'cache-control': 'max-age=0',
  'priority': 'u=0, i',
  'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
  'sec-ch-ua-full-version-list': '"Not/A)Brand";v="8.0.0.0", "Chromium";v="126.0.6478.127", "Google Chrome";v="126.0.6478.127"',
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

async function get_signature(pin_id) {
  const response = await axios.get('https://id.pinterest.com/resource/PinResource/get/', {
    params: {
      'source_url': `/pin/${pin_id}/visual-search/?surfaceType=flashlight`,
      'data': `{"options":{"id":"${pin_id}","field_set_key":"detailed","fetch_visual_search_objects":true},"context":{}}`,
      '_': '1720013971674'
    },
    headers: headers
  });

  const data = {
    image_signaure: response.data.resource_response.data.image_signature,
    crop: {
      y: response.data.resource_response.data.visual_objects[0].y,
      x: response.data.resource_response.data.visual_objects[0].x,
      w: response.data.resource_response.data.visual_objects[0].w,
      h: response.data.resource_response.data.visual_objects[0].h
    }
  }
  return data;
}

async function visual_search(pin_id, visual_data, bookmark = false) {
  if (!pin_id && !visual_data) throw 'pin_id or visual_data is required';

  const data = (!bookmark) ? 
    `{"options":{"categories":null,"crop":{"x":${visual_data.crop.x},"y":${visual_data.crop.y},"w":${visual_data.crop.w},"h":${visual_data.crop.h}},"crop_source":6,"domains":null,"entry_source":"flashlight","entrypoint":null,"field_set_key":"shopping_grid_item","image_signature":"${visual_data.image_signaure}","is_shopping":false,"pin_id":"${pin_id}","price_max":null,"price_min":null,"bookmarks":[]},"context":{}}` :
    `{"options":{"categories":null,"crop":{"x":${visual_data.crop.x},"y":${visual_data.crop.y},"w":${visual_data.crop.w},"h":${visual_data.crop.h}},"crop_source":6,"domains":null,"entry_source":"flashlight","entrypoint":null,"field_set_key":"shopping_grid_item","image_signature":"${visual_data.image_signaure}","is_shopping":false,"pin_id":"${pin_id}","price_max":null,"price_min":null,"bookmarks":["${bookmark}"]},"context":{}}`;
  
  const response = await axios.get('https://id.pinterest.com/resource/VisualLiveSearchResource/get/', {
      params: {
        data: data,
        source_url: `/pin/${pin_id}/visual-search/`,
        '_': '1720013971674'
      },
      headers: headers
    });

  return {res: response.data?.resource_response?.data?.results, bookmark: response.data?.resource_response?.bookmark};
}

async function crawler(pin_id) {
  let save = [];
  let output_file = `./pinterest/visual.json`;
  if (fs.existsSync(output_file)) {
    save = save.concat(JSON.parse(fs.readFileSync(output_file)))
    console.log('concate old data to new one')
  }
  console.log('total items:', save.length)
  let bookmark_id = false;

  const loops = [1, 2, 3, 4, 5];
  const visual_data = await get_signature(pin_id);
  for (let _ of loops) {
    const related = await visual_search(pin_id, visual_data, bookmark_id);
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

const pin_id = "10555380369854834";
crawler(pin_id);
