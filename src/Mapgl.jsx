import { useEffect, useRef, useState } from 'react';
import { load } from '@2gis/mapgl';
import geoData from './data/data.json';

export const MAP_CENTER = [73.368, 54.991];

// Цвета для разных типов ДТП (режим точек)
const severityColors = {
    'Легкий': { circle: '#00cc44', text: '#008833', halo: '#ffffff' },
    'Тяжёлый': { circle: '#ff8800', text: '#cc6600', halo: '#ffffff' },
    'С погибшими': { circle: '#ff0000', text: '#cc0000', halo: '#ffffff' },
};

// 5 туристических точек Омска
const TOURIST_POINTS = [
    { name: 'Любинский проспект', coords: [73.368, 54.991], desc: 'Исторический центр' },
    { name: 'Омский академический театр драмы', coords: [73.375, 54.990], desc: 'Театр' },
    { name: 'Успенский кафедральный собор', coords: [73.374, 54.987], desc: 'Собор' },
    { name: 'Парк Победы', coords: [73.360, 54.995], desc: 'Парк' },
    { name: 'Омская крепость', coords: [73.366, 54.988], desc: 'Крепость' }
];

export default function Mapgl() {
    const mapContainer = useRef(null);
    const mapInstance = useRef(null);
    const directionsRef = useRef(null);
    const markersRef = useRef([]);
    const circlesRef = useRef([]);
    const labelsRef = useRef([]);
    const heatmapSourceRef = useRef(null);
    
    const [mode, setMode] = useState('heatmap'); // 'heatmap' или 'points'
    const [routeBuilt, setRouteBuilt] = useState(false);
    const [currentZoom, setCurrentZoom] = useState(13);

    // Очистка всех слоёв (кроме карты)
    const clearAllLayers = () => {
        // Очищаем маршрут
        if (directionsRef.current) {
            directionsRef.current.clear();
            setRouteBuilt(false);
        }
        // Удаляем маркеры
        markersRef.current.forEach(marker => {
            try { marker.destroy(); } catch(e) {}
        });
        markersRef.current = [];
        // Удаляем кружки
        circlesRef.current.forEach(circle => {
            try { circle.destroy(); } catch(e) {}
        });
        circlesRef.current = [];
        // Удаляем подписи
        labelsRef.current.forEach(label => {
            try { label.destroy(); } catch(e) {}
        });
        labelsRef.current = [];
        // Удаляем тепловую карту
        if (heatmapSourceRef.current) {
            try { heatmapSourceRef.current.destroy(); } catch(e) {}
            heatmapSourceRef.current = null;
        }
        // Удаляем слой тепловой карты, если есть
        if (mapInstance.current) {
            try { mapInstance.current.removeLayer('dtp-heatmap-layer'); } catch(e) {}
        }
    };

    // Режим 1: Тепловая карта + туристический маршрут
    const showHeatmapMode = (map, mapgl) => {
        clearAllLayers();
        
        // Тепловая карта
        const source = new mapgl.GeoJsonSource(map, {
            data: geoData,
            attributes: { type: 'dtp_data' }
        });
        heatmapSourceRef.current = source;
        
        const heatmapLayer = {
            id: 'dtp-heatmap-layer',
            filter: ['==', ['sourceAttr', 'type'], 'dtp_data'],
            type: 'heatmap',
            style: {
                color: [
                    'interpolate', ['linear'], ['heatmap-density'],
                    0, 'rgba(0, 0, 0, 0)',
                    0.2, 'rgba(172, 32, 135, 1)',
                    0.4, 'rgba(255, 154, 0, 1)',
                    0.6, 'rgba(255, 252, 0, 1)',
                    0.8, 'rgba(255, 255, 63, 1)',
                    1, 'rgba(255, 255, 255, 1)'
                ],
                radius: 25,
                intensity: 0.8,
                opacity: 0.8
            }
        };
        map.addLayer(heatmapLayer);
        
        // Добавляем маркеры туристических точек
        TOURIST_POINTS.forEach((point) => {
            const marker = new mapgl.Marker(map, {
                coordinates: point.coords,
                icon: 'https://docs.2gis.com/img/mapgl/marker.svg'
            });
            markersRef.current.push(marker);
        });
        
        console.log('✅ Режим: тепловая карта + маркеры');
    };

    // Режим 2: Точки ДТП с подписями
    const showPointsMode = (map, mapgl) => {
        clearAllLayers();
        
        const featuresData = geoData.features.map(f => ({
            coords: f.geometry.coordinates,
            severity: f.properties.severity,
            category: f.properties.category || 'ДТП'
        }));
        
        // Добавляем кружки
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
        
        // Функция добавления подписей (в зависимости от зума)
        const updateLabels = () => {
            // Удаляем старые подписи
            labelsRef.current.forEach(label => {
                try { label.destroy(); } catch(e) {}
            });
            labelsRef.current = [];
            
            const zoom = map.getZoom();
            if (zoom >= 16) {
                const offsetY = Math.min(18 + (zoom - 11) * 2, 35);
                featuresData.forEach(data => {
                    const colors = severityColors[data.severity] || { circle: '#888888', text: '#666666', halo: '#ffffff' };
                    
                    const label = new mapgl.Label(map, {
                        coordinates: data.coords,
                        text: data.category,
                        font: 'Arial',
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: colors.text,
                        haloColor: colors.halo,
                        haloWidth: 2,
                        offset: [0, offsetY],
                    });
                    labelsRef.current.push(label);
                });
                console.log(`📝 Добавлено подписей: ${labelsRef.current.length} (зум ${zoom})`);
            }
        };
        
        updateLabels();
        map.on('zoomend', updateLabels);
        
        console.log(`✅ Режим: точки ДТП (${circlesRef.current.length} кружков)`);
    };

    // Переключение режима
    const toggleMode = () => {
        if (!mapInstance.current) return;
        
        const newMode = mode === 'heatmap' ? 'points' : 'heatmap';
        setMode(newMode);
        
        if (newMode === 'heatmap') {
            showHeatmapMode(mapInstance.current, window.mapgl);
        } else {
            showPointsMode(mapInstance.current, window.mapgl);
        }
    };

    // Построение маршрута (только для тепловой карты)
    const buildRoute = () => {
        if (!directionsRef.current) {
            console.error('❌ Directions не инициализирован');
            return;
        }
        const coordinates = TOURIST_POINTS.map(p => p.coords);
        directionsRef.current.pedestrianRoute({
            points: coordinates,
            style: {
                routeLineWidth: 6,
                routeColor: '#ff6600',
                substrateLineWidth: 8,
                substrateColor: 'rgba(255, 102, 0, 0.3)'
            }
        });
        setRouteBuilt(true);
        console.log('✅ Пешеходный маршрут построен');
    };

    const clearRoute = () => {
        if (directionsRef.current) {
            directionsRef.current.clear();
            setRouteBuilt(false);
            console.log('✅ Маршрут очищен');
        }
    };

    useEffect(() => {
        let isMounted = true;

        load().then((mapglAPI) => {
            if (!isMounted || !mapContainer.current) return;
            window.mapgl = mapglAPI;

            const map = new mapglAPI.Map(mapContainer.current, {
                center: MAP_CENTER,
                zoom: 13,
                key: '2ba0ca1c-c356-43ea-846a-046aa834957d',
                style: '587502b8-457a-4ca7-9c90-967b41883c0f'
            });
            mapInstance.current = map;

            // Отслеживаем зум
            const updateZoom = () => {
                setCurrentZoom(Math.round(map.getZoom() * 10) / 10);
            };
            map.on('zoomend', updateZoom);
            updateZoom();

            // Инициализируем Directions
            if (window.mapgl && window.mapgl.Directions) {
                const directions = new window.mapgl.Directions(map, {
                    directionsApiKey: '2ba0ca1c-c356-43ea-846a-046aa834957d'
                });
                directionsRef.current = directions;
                console.log('✅ Directions инициализирован');
            }

            // Запускаем режим по умолчанию (тепловая карта)
            map.on('styleload', () => {
                showHeatmapMode(map, mapglAPI);
            });
        });

        return () => {
            isMounted = false;
            if (mapInstance.current) {
                mapInstance.current.destroy();
            }
        };
    }, []);

    return (
        <div style={{ position: 'relative' }}>
            <div ref={mapContainer} id="map-container" style={{ width: '100%', height: '100vh' }} />

            {/* Плашка с зумом */}
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
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
                🔍 Zoom: {currentZoom}
                {mode === 'points' && currentZoom >= 16 ? (
                    <span style={{ color: '#00ff88', marginLeft: '8px' }}>📝 подписи видны</span>
                ) : mode === 'points' && currentZoom < 16 ? (
                    <span style={{ color: '#ffaa00', marginLeft: '8px' }}>🔍 Приблизьтесь (16+)</span>
                ) : null}
            </div>

            {/* Кнопка переключения режима */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 1000,
                display: 'flex',
                gap: '10px'
            }}>
                <button onClick={toggleMode} style={{
                    padding: '10px 20px',
                    backgroundColor: mode === 'heatmap' ? '#4caf50' : '#ff6600',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}>
                    {mode === 'heatmap' ? '📍 Переключить на точки ДТП' : '🔥 Переключить на тепловую карту'}
                </button>

                {/* Кнопка маршрута (только для тепловой карты) */}
                {mode === 'heatmap' && (
                    !routeBuilt ? (
                        <button onClick={buildRoute} style={{
                            padding: '10px 20px',
                            backgroundColor: '#ff6600',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}>
                            🚶 Построить маршрут
                        </button>
                    ) : (
                        <button onClick={clearRoute} style={{
                            padding: '10px 20px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}>
                            🗑️ Очистить маршрут
                        </button>
                    )
                )}
            </div>

            {/* Легенда (меняется в зависимости от режима) */}
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
                {mode === 'heatmap' ? (
                    <>
                        <h4 style={{ margin: '0 0 8px 0' }}>🔥 Тепловая карта ДТП</h4>
                        <div><span style={{ background: '#ac2087', display: 'inline-block', width: '20px', height: '12px', marginRight: '8px' }}></span> Низкая плотность</div>
                        <div><span style={{ background: '#ff9a00', display: 'inline-block', width: '20px', height: '12px', marginRight: '8px' }}></span> Средняя плотность</div>
                        <div><span style={{ background: '#fffc00', display: 'inline-block', width: '20px', height: '12px', marginRight: '8px' }}></span> Высокая плотность</div>
                        <hr />
                        <div>📍 Маркеры — туристические точки</div>
                        <div>🚶 Оранжевая линия — пешеходный маршрут</div>
                    </>
                ) : (
                    <>
                        <h4 style={{ margin: '0 0 8px 0' }}>📍 Точки ДТП</h4>
                        <div><span style={{ background: '#00cc44', display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', marginRight: '8px' }}></span> Легкий</div>
                        <div><span style={{ background: '#ff8800', display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', marginRight: '8px' }}></span> Тяжёлый</div>
                        <div><span style={{ background: '#ff0000', display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', marginRight: '8px' }}></span> С погибшими</div>
                        <hr />
                        <div>📝 Подписи — категория ДТП</div>
                        <div>🔍 Подписи видны при зуме 16+</div>
                    </>
                )}
            </div>
        </div>
    );
}