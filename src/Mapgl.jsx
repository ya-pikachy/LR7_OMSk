import { useEffect } from 'react';
import { load } from '@2gis/mapgl';
import geoData from './data/data.json';

export const MAP_CENTER = [73.368, 54.991];

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

            console.log('Точек для тепловой карты:', geoData.features.length);

            // Создаём источник данных с уникальным атрибутом
            const source = new mapgl.GeoJsonSource(map, {
                data: geoData,
                attributes: { type: 'heatmap_data' }
            });

            // Тепловой слой (по методичке стр. 12-13)
            const heatmapLayer = {
                id: 'dtp-heatmap-layer',
                filter: ['==', ['sourceAttr', 'type'], 'heatmap_data'],
                type: 'heatmap',
                style: {
                    color: [
                        'interpolate', ['linear'], ['heatmap-density'],
                        0, 'rgba(0, 0, 0, 0)',
                        0.2, 'rgba(172, 32, 135, 1)',   // фиолетовый
                        0.4, 'rgba(255, 154, 0, 1)',    // оранжевый
                        0.6, 'rgba(255, 252, 0, 1)',    // жёлтый
                        0.8, 'rgba(255, 255, 63, 1)',   // светло-жёлтый
                        1, 'rgba(255, 255, 255, 1)'     // белый
                    ],
                    radius: 25,
                    intensity: 0.8,
                    opacity: 0.8,
                    downscale: 1
                }
            };

            map.on('styleload', () => {
                map.addLayer(heatmapLayer);
                console.log('✅ Тепловая карта добавлена!');
            });
        });

        return () => {
            if (map) map.destroy();
        };
    }, []);

    // Легенда для тепловой карты
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
                minWidth: '180px'
            }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Тепловая карта ДТП</h4>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ display: 'inline-block', width: '20px', height: '12px', background: 'rgba(172, 32, 135, 1)', marginRight: '8px' }}></span>
                    <span>Низкая плотность</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ display: 'inline-block', width: '20px', height: '12px', background: 'rgba(255, 154, 0, 1)', marginRight: '8px' }}></span>
                    <span>Средняя плотность</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ display: 'inline-block', width: '20px', height: '12px', background: 'rgba(255, 252, 0, 1)', marginRight: '8px' }}></span>
                    <span>Высокая плотность</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ display: 'inline-block', width: '20px', height: '12px', background: 'rgba(255, 255, 255, 1)', marginRight: '8px', border: '1px solid #ccc' }}></span>
                    <span>Максимальная</span>
                </div>
            </div>
        </div>
    );
}