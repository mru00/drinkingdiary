#! /bin/bash -xeu


date=$(date)

sed -i -e "s/<!--Vb-->.*<!--Ve-->/<!--Vb-->$date<!--Ve-->/" drinking/index.html
sed -i -e "s/ Serial.*/ Serial $date/" drinking/cache.appmanifest

scp drinking/* drinking/.htaccess sisyphus.teil.cc:public_html/drinking_dev

echo date: $date

