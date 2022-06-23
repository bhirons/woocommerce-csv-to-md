import fs from 'fs'
import csv from 'csv-parser'
import { debug } from 'console'
import ustr from 'underscore.string'
import yaml from 'yamljs'

const names = [];
// date will be date of this invocation
const importDate = new Date().toISOString();
const sourcePath = './csv-file';
const resultPath = './resulting-md-files';
// set the target path for images, the image URLS will be flattened with the intent of all images imported here
const imageDest = 'images/products/';
const files = fs.readdirSync(sourcePath);

// Create the resultPath in case it doesn't exist
if (!fs.existsSync(resultPath)) {
    fs.mkdirSync(resultPath);
}

// Use the object from csv-parser to create a hugo readable md
function createMd(data) {
    //prepare the product name for use as a filename
    // capture my legacy SKU
    let out = {};
    let name = ustr.slugify(data.Name);
    let sku = ustr.unquote(data['SKU'], "'");
    let tags = [];
    let images = [];
    let categories = [];
    
    //description contains a strange newline return artifact '\r\\n\r\\n' that we can clean
    let content = ustr(data['Description']).replace(/\\r\\\\n|\\n/gm,' ').clean().trim().value();
    console.log(content);
    // console.log(sku);
    let ptype = data.Type;
    console.log(`${ptype} product ${data.Name} found`);

    //my items contain duplicate names and I want to slugify the product name for use as a file name
    //use this array to keep count of the dupes
    //if there is more than one, we will start adding -2, and -3, and so on
    names.push(name);
    let cnt = names.filter(nm => nm === name).length;
    if(cnt > 1)
        name = name.concat(`-${cnt}`);
    
    // Parsing tags since they usually come in this format: "tag1, tag2, tag3"
    // tags are for specific things about this product
    if (data['Tags']) {
        //console.log(data['Tags']);
        //transform to an array of strings with single spaces and no surrounding quotes
        tags = data['Tags']
                .split(',')
                .map(tag => ustr(tag).trim().unquote("'").decapitalize().value());
    }

    // Parsing categories which is also a comma list
    // I liked having categories in WooCommerce
    // Categories are for broadly grouping many products 
    if (data['Categories']) {
        //console.log(data['Tags']);
        //transform to an array of strings with single spaces and no surrounding quotes
        categories = data['Categories']
                .split(',')
                .map(kitty => ustr(kitty).trim().clean().unquote("'").titleize().value());
    }
    
    // Parsing images which are also a comma list
    if (data['Images']) {
        //console.log(data['Images']);
        images = data['Images']
                 .split(',')
                 .map(imgurl => imgurl.substring(imgurl.lastIndexOf('/') + 1))
                 .map(imgurl => ustr.clean(imgurl))
                 .map(imgurl => ustr(imageDest).concat(imgurl).value())
    }

    out.title = ustr.clean(data['Name']);
    out.date = importDate;
    out.enabled = false;
    out.sku = sku;
    out.description = ustr(data['Short description']).replace(/\\r\\\\n|\\n/gm,' ').clean().value();
    out.price = ustr.numberFormat(ustr.toNumber(data['Regular price'], 2), 2, ".", ",");
    out.images = images;
    out.thumbnail = ""
    out.label = ""
    //console.log(images);
    out.tags = tags;
    //console.log(tags);
    out.categories = categories;

    // Write file
    // we want our product hugo .md file with the yaml at the top for the front matter and the content below
    fs.writeFileSync(`${resultPath}/${name}.md`, `---\r\n${yaml.stringify(out, null, 2)}\r\n---\r\n${content}`);
}

// This is to ignore the .gitkeep and allow multiple .csv
console.log(`Files:\r\n${files}`)
files.forEach(file => {
    if (file.split('.').at(-1) === 'csv') {
        fs.createReadStream(sourcePath + '/' + file)
            .pipe(csv())
            .on('data', (row) => {
                //console.log(row);
                //requirement is for simpe and variable types only
                if (row['Type'] === 'simple' || row['Type'] === 'variable') {
                    createMd(row);    
                }
                else {
                    console.log(`Skipped ${row['Type']}.`)
                }
            })
            .on('end', () => { console.log('DONE') })
    }
})