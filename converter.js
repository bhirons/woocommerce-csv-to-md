import fs from 'fs'
import csv from 'csv-parser'
import { debug } from 'console'
import ustr from 'underscore.string'
import yaml from 'yamljs'

const names = []
// date will be date of this invocation
const importDate = new Date().toISOString();
const sourcePath = './csv-file'
const resultPath = './resulting-md-files'
// set the target path for images, the image URLS will be flattened with the intent of all images imported here
const imageDest = 'images/products/'
const files = fs.readdirSync(sourcePath)

// Create the resultPath in case it doesn't exist
if (!fs.existsSync(resultPath)) {
    fs.mkdirSync(resultPath);
}

// Use the object from csv-parser to create a hugo readable md
function createMd(data) {
    //prepare the product name for use as a filename
    // capture my legacy SKU
    let out = {}
    let name = ustr.slugify(data.Name);
    let sku = ustr.unquote(data['SKU'], "'");
    let tags = [];
    let images = [];
    let content = ustr.clean(data['Description']);
    // console.log(name);
    // console.log(sku);

    //my items contain duplicate names and I want to slugify the product name for use as a file name
    //use this array to keep count of the dupes
    // TODO consider options for handling variable product that is being flattened here
    names.push(name)
    let cnt = names.filter(nm => nm === name).length;
    //if there is more than one, we will start adding -2, and -3, and so on
    if(cnt > 1)
        name = name.concat(`-${cnt}`);
    
    // Parsing tags since they usually come in this format: "tag1, tag2, tag3"
    if (data['Tags']) {
        //console.log(data['Tags']);
        //transform to an array of strings with single spaces and no surrounding quotes
        tags = data['Tags']
                .split(',')
                .map(tag => ustr(tag).trim().unquote("'").decapitalize().value());
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
    out.description = ustr.clean(data['Short description']);
    out.price = ustr.numberFormat(ustr.toNumber(data['Regular price'], 2), 2, ".", ",");
    out.images = images;
    //console.log(images);
    out.tags = tags;
    //console.log(tags);

    // Write file
    // we want our product hugo .md file with the yaml at the top for the front matter and the content below
    fs.writeFileSync(`${resultPath}/${name}.md`, `---\r\n${yaml.stringify(out, null, 2)}\r\n---\r\n${content}`);
}

// This is to ignore the .gitkeep and allow multiple .csv
files.forEach(file => {
    if (file.split('.').at(-1) === 'csv') {
        fs.createReadStream(sourcePath + '/' + file)
            .pipe(csv())
            .on('data', (row) => {
                console.log(row);
                createMd(row);
            })
            .on('end', () => { console.log('DONE') })
    }
})