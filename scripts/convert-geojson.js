const fs = require('fs');

// ПРОВЕРЬТЕ: точно ли такое имя файла?
const inputFile = 'src/data/omskaia-oblast.geojson';
const outputFile = 'src/data/omsk-converted.json';

console.log('Читаем файл:', inputFile);

if (!fs.existsSync(inputFile)) {
    console.error('Файл не найден! Убедитесь, что файл лежит в', inputFile);
    process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

console.log('Всего записей:', rawData.features.length);

const convertedData = {
    type: 'FeatureCollection',
    features: rawData.features.slice(0, 500).map((item) => {
        const lat = item.properties.point.lat;
        const lon = item.properties.point.long;
        
        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [lon, lat]
            },
            properties: item.properties
        };
    })
};

fs.writeFileSync(outputFile, JSON.stringify(convertedData, null, 2));
console.log('Создан файл:', outputFile);
console.log('Точек сохранено:', convertedData.features.length);