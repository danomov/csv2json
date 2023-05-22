import { useRef, useState } from 'react';
import axios from 'axios';
import csv from 'csvtojson';
import './App.css';

const results = {};
let fileName = 'fontData';

function getStructuredJSON(id, data) {
  const display_name = (results[id] && results[id].display_name) ? results[id].display_name : data.meta_data.display_name;
  const font_svg_url = (results[id] && results[id].font_svg_url) ? results[id].font_svg_url : data.meta_data.font_svg_url;
  const is_paid = (results[id] && results[id].is_paid) ? results[id].is_paid : data.is_paid;

  const fontData = {
    "url": data.url,
    "app": data.app,
    "width": data.width,
    "height": data.height,
    "data_url": data.data_url,
    "id": data.id,
    "license": data.license,
    "package_id": data.package_id,
    "meta_data": {
      "font_name": data.meta_data.font_name,
      "display_name": display_name,
      "font_preview_url": data.meta_data.font_preview_url,
      "font_svg_url": font_svg_url,
      "source": data.meta_data.source
    },
    "type": data.type,
    "package_uid": data.package_uid,
    "price": data.price,
    "title": data.title,
    "free_for_rewarded_video": data.free_for_rewarded_video,
    "featured": data.featured,
    "segments": data.segments,
    "is_monotype": data.is_monotype,
    "commercial": data.commercial,
    "licenses": data.licenses,
    "is_paid": is_paid,
    "is_new": data.is_new,
    "package_meta_data": data.package_meta_data
  }

  return fontData;
}

async function processIds(ids) {
  const endpoint = 'https://picsartstage2.com/pa-api/stage/shop/item/';
  const jsonData = [];

  for(const id of ids) {
    try {
      const res = await axios({
        url: `${endpoint}${id}`,
        headers: {
          "Origin": "*",
        },
        method: 'GET',
      });
      const data = res.data;
      jsonData.push(getStructuredJSON(id, data.response));
    } catch (e) {
      console.error(`failed with this id:${id}`)
    }
  }


  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData));
  console.log('JSON data has been created!');
  console.log(jsonData);

  return dataStr;
}

function App() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef();

  const handleConvert = async (e) => {
    const file = inputRef.current.files[0];
    const reader = new FileReader();
    const headers = [
      "Font Ordering",
      "Font Name",
      "Display Name",
      "Free/Premium",
      "New",
      "SVG File",
      "ID",
      "Packages"
    ];

    reader.onload = async function(event) {
      const csvData = event.target.result;
      csv({ headers })
        .fromString(csvData)
        .subscribe((data, lineNumber) => {
          if (lineNumber === 0) return;
          if (data['Language']) fileName = data['Language'];

          results[data.ID] = {
            is_paid: data['Free/Premium'] === 'Premium',
            font_svg_url: data['SVG File'],
            display_name: data['Display Name'],
          }
        })
        .then(async () => {
          setIsLoading(true);
          const data = await processIds(Object.keys(results));
          setData(data);
          setIsLoading(false);
        })
    };

    reader.readAsText(file);
  }

  return (
    <div className="app">
      <div className='inputContainer'>
        <input id="fileInput" type="file" accept=".csv" ref={inputRef} />
        <button onClick={handleConvert}>Convert</button>
      </div>
      {isLoading ? "Loading..." : null}
      {data ? <a href={data} download={`${fileName}.json`}>Click to download JSON</a> : null}
    </div>
  );
}

export default App;
