const fs = require('fs');

// Читаем полный файл
const rawData = JSON.parse(fs.readFileSync('src/data/omskaia-oblast.geojson', 'utf8'));

console.log('Всего записей:', rawData.features.length);

// Преобразуем в формат из методички
const convertedData = {
    type: 'FeatureCollection',
    features: rawData.features.slice(0, 1000).map(item => ({
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [item.properties.point.long, item.properties.point.lat]
        },
        properties: {
            id: item.properties.id,
            severity: item.properties.severity,
            category: item.properties.category,
            address: item.properties.address,
            datetime: item.properties.datetime
        }
    }))
};

fs.writeFileSync('src/data/data.json', JSON.stringify(convertedData, null, 2));
console.log('✅ Создан src/data/data.json с', convertedData.features.length, 'точками');