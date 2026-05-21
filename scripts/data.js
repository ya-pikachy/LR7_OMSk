const fs = require('fs');

// 1. Читаем большой файл
const rawData = fs.readFileSync('./src/data/omskaia-oblast.geojson', 'utf8');
const geojson = JSON.parse(rawData);

// 2. Оставляем только первые 1000 объектов (features)
geojson.features = geojson.features.slice(0, 1000);

// 3. Записываем результат в новый маленький файл data.json
fs.writeFileSync('./src/data/data.json', JSON.stringify(geojson, null, 2));

console.log('Готово! Маленький файл создан в src/data/data.json');_