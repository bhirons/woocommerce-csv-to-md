# woocommerce-csv-to-hugo-md-files

## Purpose

To re-implement a Wordpres/WooCommerce storefront into a jamstack-like staic site built using Hugo.  This script picks up a attributes from a CSV file exported from the default WooCommere Export button and saves them as hugo style md files with front matter yaml at the top of the output file, and any content at the  bottom.

This repo branched from csv-to-hugo-md-files cause it was a good boilerplate to get started.

## Usage

- Clone the repository
- `npm i`
- Move your `.csv` file(s) into the `csv-file` folder
- `node .\converter.js`
- Look at results in `resulting-md-files`

## Behavior

This behavior is very specific to the requiremnts, and all of this is easily modified.  Suggest you fork this repo and go to town ;)

- output file is slugified from product name
- images paths are flattened
- duplicates are named -2, -3, etc
- script only processes simple or variable products and checks for type when parsing
- script cleans and trims various text artifacts found in export data
- captures categories and tags
