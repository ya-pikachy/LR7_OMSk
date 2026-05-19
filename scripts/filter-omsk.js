const fs = require('fs');

// Укажи путь к твоему исходному файлу (68 МБ)
const inputFile = 'src/data/omskaia-oblast.geojson';
const outputFile = 'src/data/omsk-only.json';

console.log('Читаем файл:', inputFile);

if (!fs.existsSync(inputFile)) {
    console.error('❌ Файл не найден! Убедись, что путь правильный.');
    process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
console.log('✅ Всего записей в файле:', rawData.features.length);

// Фильтруем только Омск
const omskFeatures = rawData.features.filter(item => {
    const region = item.properties.region;
    const parentRegion = item.properties.parent_region;
    return region === 'Омск' || parentRegion === 'Омская область';
});

console.log('✅ Записей по Омску:', omskFeatures.length);

// Преобразуем в формат 2GIS
const omskData = {
    type: 'FeatureCollection',
    features: omskFeatures.slice(0, 2000).map(item => {
        const lat = item.properties.point.lat;
        const lon = item.properties.point.long;
        
        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [lon, lat]
            },
            properties: {
                severity: item.properties.severity,
                category: item.properties.category,
                address: item.properties.address
            }
        };
    })
};

fs.writeFileSync(outputFile, JSON.stringify(omskData, null, 2));
console.log('✅ Создан файл:', outputFile);
console.log('✅ Точек сохранено:', omskData.features.length);