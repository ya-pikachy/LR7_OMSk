import { useEffect } from 'react';
import { load } from '@2gis/mapgl';
import geoData from './data/data.json';

export const MAP_CENTER = [73.368, 54.991];

// Цвета для разных типов ДТП (на основе реальных данных)
const severityColors = {
    'Легкий': '#00cc44',      // зелёный
    'Тяжёлый': '#ff8800',     // оранжевый
    'С погибшими': '#ff0000', // красный
};

export default function Mapgl() {
    useEffect(() => {
        let map = null;

        load().then((mapgl) => {
            map = new mapgl.Map('map-container', {
                center: MAP_CENTER,
                zoom: 11,
                key: '2ba0ca1c-c356-43ea-846a-046aa834957d',
                style: '587502b8-457a-4ca7-9c90-967b41883c0f'
            });

            // Статистика по типам
            const stats = {};
            geoData.features.forEach(f => {
                const s = f.properties.severity;
                stats[s] = (stats[s] || 0) + 1;
            });
            console.log('📊 Статистика ДТП:');
            console.log(`   Легких: ${stats['Легкий'] || 0}`);
            console.log(`   Тяжёлых: ${stats['Тяжёлый'] || 0}`);
            console.log(`   С погибшими: ${stats['С погибшими'] || 0}`);
            console.log(`   Всего: ${geoData.features.length}`);

            // Добавляем кружки на карту
            geoData.features.forEach(feature => {
                const severity = feature.properties.severity;
                const color = severityColors[severity] || '#888888';
                const coords = feature.geometry.coordinates;
                
                new mapgl.Circle(map, {
                    coordinates: coords,
                    radius: 10,
                    color: color,
                    strokeWidth: 2,
                    strokeColor: '#ffffff',
                    opacity: 0.85
                });
            });
            
            console.log('✅ Добавлено цветных кружков:', geoData.features.length);
        });

        return () => {
            if (map) map.destroy();
        };
    }, []);

    // Легенда карты
    return (
        <div style={{ position: 'relative' }}>
            <div id="map-container" style={{ width: '100%', height: '100vh' }} />
            <div style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '12px 16px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                fontFamily: 'Arial, sans-serif',
                fontSize: '12px',
                zIndex: 1000,
                minWidth: '150px'
            }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Тяжесть ДТП</h4>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#00cc44', marginRight: '8px' }}></span>
                    <span>Легкий</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#ff8800', marginRight: '8px' }}></span>
                    <span>Тяжёлый</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#ff0000', marginRight: '8px' }}></span>
                    <span>С погибшими</span>
                </div>
            </div>
        </div>
    );
}