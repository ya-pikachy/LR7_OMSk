import { useEffect, useRef, useState } from 'react';
import { load } from '@2gis/mapgl';
import geoData from './data/data.json';

export const MAP_CENTER = [73.368, 54.991];

// Цвета для разных типов ДТП
const severityColors = {
    'Легкий': { circle: '#00cc44', text: '#008833', halo: '#ffffff' },
    'Тяжёлый': { circle: '#ff8800', text: '#cc6600', halo: '#ffffff' },
    'С погибшими': { circle: '#ff0000', text: '#cc0000', halo: '#ffffff' },
};

export default function Mapgl() {
    const mapRef = useRef(null);
    const circlesRef = useRef([]);
    const labelsRef = useRef([]);
    const [currentZoom, setCurrentZoom] = useState(11);

    useEffect(() => {
        let map = null;

        load().then((mapgl) => {
            map = new mapgl.Map('map-container', {
                center: MAP_CENTER,
                zoom: 11,
                key: '2ba0ca1c-c356-43ea-846a-046aa834957d',
                style: '587502b8-457a-4ca7-9c90-967b41883c0f'
            });
            mapRef.current = map;

            // Статистика
            const stats = {};
            geoData.features.forEach(f => {
                const s = f.properties.severity;
                stats[s] = (stats[s] || 0) + 1;
            });
            console.log('📊 Статистика ДТП:', stats);
            console.log(`   Всего: ${geoData.features.length}`);

            // Сохраняем данные для пересоздания подписей
            const featuresData = geoData.features.map(f => ({
                coords: f.geometry.coordinates,
                severity: f.properties.severity,
                category: f.properties.category || 'ДТП'
            }));

            // Функция создания подписей
            const createLabels = () => {
                // Удаляем старые подписи
                labelsRef.current.forEach(label => {
                    try { label.destroy(); } catch(e) {}
                });
                labelsRef.current = [];
                
                // Создаём новые подписи
                featuresData.forEach(data => {
                    const colors = severityColors[data.severity] || { circle: '#888888', text: '#666666', halo: '#ffffff' };
                    
                    const label = new mapgl.Label(map, {
                        coordinates: data.coords,
                        text: data.category,
                        font: 'Arial',
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: colors.text,
                        haloColor: colors.halo,   // белая обводка
                        haloWidth: 2,             // толщина обводки
                        offset: [0, 18],
                    });
                    labelsRef.current.push(label);
                });
                console.log(`✅ Создано подписей: ${labelsRef.current.length}`);
            };

            // Функция удаления подписей
            const removeLabels = () => {
                labelsRef.current.forEach(label => {
                    try { label.destroy(); } catch(e) {}
                });
                labelsRef.current = [];
                console.log('🗑️ Подписи удалены');
            };

            // Функция обновления при изменении зума
            const onZoomChange = () => {
                const zoom = map.getZoom();
                setCurrentZoom(Math.round(zoom * 10) / 10);  // округляем до 1 знака
                const showLabels = zoom >= 16;
                
                if (showLabels && labelsRef.current.length === 0) {
                    createLabels();
                } else if (!showLabels && labelsRef.current.length > 0) {
                    removeLabels();
                }
            };

            // Добавляем кружки (всегда видны)
            featuresData.forEach(data => {
                const colors = severityColors[data.severity] || { circle: '#888888', text: '#666666' };
                
                const circle = new mapgl.Circle(map, {
                    coordinates: data.coords,
                    radius: 9,
                    color: colors.circle,
                    strokeWidth: 2,
                    strokeColor: '#ffffff',
                    opacity: 0.85
                });
                circlesRef.current.push(circle);
            });
            
            console.log(`✅ Добавлено кружков: ${circlesRef.current.length}`);
            
            // Подписываемся на изменение зума
            map.on('zoomend', onZoomChange);
            
            // Проверяем начальный зум
            onZoomChange();
            
            console.log('💡 Подписи появляются при зуме 13+, исчезают при отдалении');
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.destroy();
            }
        };
    }, []);

    return (
        <div style={{ position: 'relative' }}>
            <div id="map-container" style={{ width: '100%', height: '100vh' }} />
            
            {/* Плашка с текущим зумом */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(5px)',
                padding: '8px 16px',
                borderRadius: '20px',
                fontFamily: 'monospace',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#ffffff',
                zIndex: 1000,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.2)'
            }}>
                🔍 Zoom: {currentZoom}
                {currentZoom >= 16 ? (
                    <span style={{ color: '#00ff88', marginLeft: '8px' }}>📝 подписи видны</span>
                ) : (
                    <span style={{ color: '#ff8888', marginLeft: '8px' }}>📝 подписи скрыты</span>
                )}
            </div>
            
            {/* Легенда */}
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
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Тяжесть ДТП</h4>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#00cc44', marginRight: '8px' }}></span>
                    <span style={{ color: '#008833' }}>Легкий</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#ff8800', marginRight: '8px' }}></span>
                    <span style={{ color: '#cc6600' }}>Тяжёлый</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#ff0000', marginRight: '8px' }}></span>
                    <span style={{ color: '#cc0000' }}>С погибшими</span>
                </div>
                <hr style={{ margin: '8px 0' }} />
                <div style={{ fontSize: '11px', color: '#666' }}>
                    📍 Цвет кружка — тяжесть ДТП<br />
                    📝 Подпись — категория ДТП<br />
                    🔍 Подписи видны при зуме 13+
                </div>
            </div>
        </div>
    );
}