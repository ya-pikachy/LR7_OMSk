const fs = require('fs');

// Читаем однострочный файл
const rawData = fs.readFileSync('src/data/omskaia-oblast.geojson', 'utf8');
const fullGeoJSON = JSON.parse(rawData);

console.log('Всего точек в файле:', fullGeoJSON.features.length);

// Берём первые 500 точек (для начала)
fullGeoJSON.features = fullGeoJSON.features.slice(0, 500);

// Сохраняем в новый файл в нормальном форматировании
fs.writeFileSync('src/data/omsk-500.json', JSON.stringify(fullGeoJSON, null, 2));

console.log('Создан файл src/data/omsk-500.json с 500 точками');