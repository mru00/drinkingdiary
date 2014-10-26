#! /bin/bash -xeu


date=$(date +"%Y-%m-%d--%H:%M")

sed -i -e "s/<!--Vb-->.*<!--Ve-->/<!--Vb-->$date<!--Ve-->/" drinking/index.html
sed -i -e "s/ Serial.*/ Serial $date/" drinking/cache.appmanifest

scp drinking/* drinking/.htaccess sisyphus.teil.cc:public_html/drinking

echo date: $date

