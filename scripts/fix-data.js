const fs = require('fs');

// Читаем ваш исходный файл
const rawData = JSON.parse(fs.readFileSync('src/data/omsk-500.json', 'utf8'));

console.log('Всего записей:', rawData.features.length);

// Преобразуем в правильный GeoJSON
const fixedData = {
    type: 'FeatureCollection',
    features: rawData.features.map((item, index) => {
        // Берём координаты из поля point
        const lat = item.properties.point.lat;
        const lon = item.properties.point.long;
        
        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [lon, lat]  // [долгота, широта]
            },
            properties: {
                severity: item.properties.severity,
                category: item.properties.category,
                address: item.properties.address,
                datetime: item.properties.datetime
            }
        };
    })
};

console.log('Пример первой точки:', fixedData.features[0]);
console.log('Координаты:', fixedData.features[0].geometry.coordinates);

// Сохраняем
fs.writeFileSync('src/data/omsk-fixed.json', JSON.stringify(fixedData, null, 2));
console.log('Создан файл src/data/omsk-fixed.json');