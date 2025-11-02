// Função principal para buscar locais próximos a partir do CEP
async function buscarLocaisPorCep(cep) {
    try {
        // 1. Buscar endereço completo pelo CEP
        const enderecoCompleto = await getEnderecoViaCep(cep);

        // 2. Buscar restaurantes próximos
        const restaurantesHtml = await buscarRestaurantesReal(enderecoCompleto);

        // 3. Buscar aeroporto próximo
        const aeroportoHtml = await buscarAeroportoReal(enderecoCompleto);

        // 4. Buscar hotéis próximos (pode ser implementado similar aos restaurantes)
        // Exemplo: const hoteisHtml = await buscarHoteisReal(enderecoCompleto);
        // Por enquanto, retorna vazio
        const hoteisHtml = '<div class="result-item"><h4>Funcionalidade de hotéis em desenvolvimento</h4></div>';

        // 5. Retornar resultado agrupado
        return {
            endereco: enderecoCompleto,
            restaurantes: restaurantesHtml,
            aeroporto: aeroportoHtml,
            hoteis: hoteisHtml
        };
    } catch (error) {
        console.error('Erro ao buscar locais por CEP:', error);
        throw error;
    }
}
// Função para buscar endereço completo pelo CEP usando ViaCEP
async function getEnderecoViaCep(cep) {
    const url = `https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.erro) throw new Error('CEP não encontrado');
        // Monta o endereço no formato antigo, todos os campos juntos
        return `${data.logradouro || ''} ${data.bairro || ''} ${data.localidade || ''} ${data.uf || ''} Brasil ${data.cep || cep}`.replace(/ +/g, ' ').trim();
    } catch (error) {
        console.error('Erro ao buscar endereço ViaCEP:', error);
        throw error;
    }
}
// Funções de API para busca de aeroportos, restaurantes e mapas

// Função para obter coordenadas de um endereço usando Mapbox Geocoding API
async function getCoordinates(address, proximity = null) {
    const accessToken = 'pk.eyJ1IjoiZ2FicmllbHNvdXNhLXNwdGVjaCIsImEiOiJjbWZ5N2ZzaGwwaHp2MmpwemFtczJib3YzIn0.opNfyOXGWBuKl1R4iJiSOQ';
    let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${accessToken}&limit=1`;
    if (proximity && proximity.lat && proximity.lon) {
        url += `&proximity=${proximity.lon},${proximity.lat}`;
    }
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            return {
                lat: feature.center[1],
                lon: feature.center[0],
                display_name: feature.place_name
            };
        }
        throw new Error('Endereço não encontrado');
    } catch (error) {
        console.error('Erro ao obter coordenadas:', error);
        throw error;
    }
}

// Função para calcular distância entre dois pontos (fórmula de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Função auxiliar para buscar endereço aproximado por coordenadas usando Mapbox
async function getEnderecoPorCoordenadas(lat, lon) {
    const accessToken = 'pk.eyJ1IjoiZ2FicmllbHNvdXNhLXNwdGVjaCIsImEiOiJjbWZ5N2ZzaGwwaHp2MmpwemFtczJib3YzIn0.opNfyOXGWBuKl1R4iJiSOQ';
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${accessToken}&limit=1`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            return data.features[0].place_name;
        }
        return 'Endereço não disponível';
    } catch {
        return 'Endereço não disponível';
    }
}

// Função para buscar aeroportos próximos
async function buscarAeroportoReal(endereco) {
    try {
        // Obter coordenadas do endereço
        const coords = await getCoordinates(endereco);
        // Lista de aeroportos principais do Brasil com coordenadas
        const aeroportos = [
            { nome: "Aeroporto Internacional de São Paulo/Guarulhos", sigla: "GRU", lat: -23.4356, lon: -46.4731 },
            { nome: "Aeroporto de São Paulo/Congonhas", sigla: "CGH", lat: -23.6266, lon: -46.6554 },
            { nome: "Aeroporto Internacional do Rio de Janeiro/Galeão", sigla: "GIG", lat: -22.8099, lon: -43.2505 },
            { nome: "Aeroporto Santos Dumont", sigla: "SDU", lat: -22.9105, lon: -43.1634 },
            { nome: "Aeroporto Internacional de Brasília", sigla: "BSB", lat: -15.8711, lon: -47.9172 },
            { nome: "Aeroporto Internacional de Belo Horizonte/Confins", sigla: "CNF", lat: -19.6244, lon: -43.9719 },
            { nome: "Aeroporto Internacional de Salvador", sigla: "SSA", lat: -12.9086, lon: -38.3225 },
            { nome: "Aeroporto Internacional de Recife", sigla: "REC", lat: -8.1265, lon: -34.9236 },
            { nome: "Aeroporto Internacional de Fortaleza", sigla: "FOR", lat: -3.7763, lon: -38.5326 },
            { nome: "Aeroporto Internacional de Porto Alegre", sigla: "POA", lat: -29.9939, lon: -51.1711 }
        ];
        // Calcular distâncias e encontrar o mais próximo
        let aeroportoMaisProximo = null;
        let menorDistancia = Infinity;
        for (const aeroporto of aeroportos) {
            const distancia = calculateDistance(coords.lat, coords.lon, aeroporto.lat, aeroporto.lon);
            if (distancia < menorDistancia) {
                menorDistancia = distancia;
                aeroportoMaisProximo = { ...aeroporto, distancia };
            }
        }
        if (aeroportoMaisProximo) {
            // Buscar endereço aproximado do aeroporto
            const enderecoAeroporto = await getEnderecoPorCoordenadas(aeroportoMaisProximo.lat, aeroportoMaisProximo.lon);
            return `
                <div class="result-item">
                    <h4>${aeroportoMaisProximo.nome}</h4>
                    <p><strong>Sigla:</strong> ${aeroportoMaisProximo.sigla}</p>
                    <p><strong>Endereço:</strong> ${enderecoAeroporto}</p>
                    <p><strong>Distância:</strong> ${aeroportoMaisProximo.distancia.toFixed(1)} km</p>
                </div>
            `;
        } else {
            throw new Error('Nenhum aeroporto encontrado');
        }
    } catch (error) {
        console.error('Erro na busca de aeroporto:', error);
        throw new Error('Erro ao buscar aeroporto: ' + error.message);
    }
}

// Função para buscar restaurantes próximos usando Mapbox SearchBox API
async function buscarRestaurantesReal(endereco, userCoords = null) {
    try {
        // Obter coordenadas do endereço, usando proximity se disponível
        const coords = await getCoordinates(endereco, userCoords);
        const accessToken = 'pk.eyJ1IjoiZ2FicmllbHNvdXNhLXNwdGVjaCIsImEiOiJjbWZ5N2ZzaGwwaHp2MmpwemFtczJib3YzIn0.opNfyOXGWBuKl1R4iJiSOQ';
        const url = `https://api.mapbox.com/search/searchbox/v1/category/restaurant?proximity=${coords.lon},${coords.lat}&limit=3&access_token=${accessToken}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            return data.features.map(rest => {
                const nome = rest.properties.name || rest.text || 'Restaurante';
                const endereco = rest.properties.address || rest.place_formatted || 'Endereço não disponível';
                const distancia = rest.properties.distance ? (rest.properties.distance / 1000) : calculateDistance(coords.lat, coords.lon, rest.geometry.coordinates[1], rest.geometry.coordinates[0]);
                return `
                    <div class="result-item">
                        <h4>${nome}</h4>
                        <p><strong>Endereço:</strong> ${endereco}</p>
                        <p><strong>Distância:</strong> ${distancia.toFixed(1)} km</p>
                    </div>
                `;
            }).join('');
        }
        // Fallback com dados simulados se não encontrar restaurantes
        return `
            <div class="result-item">
                <h4>Restaurante Bella Vista</h4>
                <p><strong>Endereço:</strong> Rua das Flores, 123 - Centro</p>
                <p><strong>Distância:</strong> 1.2 km</p>
            </div>
            <div class="result-item">
                <h4>Pizzaria do João</h4>
                <p><strong>Endereço:</strong> Av. Principal, 456 - Jardim</p>
                <p><strong>Distância:</strong> 2.1 km</p>
            </div>
            <div class="result-item">
                <h4>Churrascaria Gaúcha</h4>
                <p><strong>Endereço:</strong> Rua do Comércio, 789 - Vila Nova</p>
                <p><strong>Distância:</strong> 3.5 km</p>
            </div>
            <p><em>Nota: Dados de exemplo para ${coords.display_name}</em></p>
        `;
    } catch (error) {
        console.error('Erro na busca de restaurantes:', error);
        throw new Error('Erro ao buscar restaurantes: ' + error.message);
    }
}

function geojsonToPolyline(cordenadas) {
    return window.polyline.encode(cordenadas.map(c => [c[1], c[0]])); // [lat, lon]
}

async function buscarRotaReal(origem, destino) {
    const MAPBOX_TOKEN = 'pk.eyJ1IjoiZ2FicmllbHNvdXNhLXNwdGVjaCIsImEiOiJjbWZ5N2ZzaGwwaHp2MmpwemFtczJib3YzIn0.opNfyOXGWBuKl1R4iJiSOQ';

    try {
        const coordsOrigem = await getCoordinates(origem);
        const coordsDestino = await getCoordinates(destino);

        
        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordsOrigem.lon},${coordsOrigem.lat};${coordsDestino.lon},${coordsDestino.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
        const routeResponse = await fetch(directionsUrl);
        const routeData = await routeResponse.json();

        if (!routeData.routes || routeData.routes.length === 0) {
            throw new Error("Nenhuma rota encontrada");
        }

        const route = routeData.routes[0];
        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);

        
        const html = `
            <div class="map-container" style="height: 400px; border-radius: 12px; overflow: hidden;" id="map"></div>
            <p>Rota de <strong>${origem}</strong> até <strong>${destino}</strong></p>
            <p><strong>Distância:</strong> ${distanceKm} km</p>
            <p><strong>Tempo estimado:</strong> ${durationMin} minutos</p>
            <p><strong>Origem:</strong> ${coordsOrigem.display_name}</p>
            <p><strong>Destino:</strong> ${coordsDestino.display_name}</p>
        `;


        //SÓ VAI INICIAR APÓS TER CERTEZA QUE O HTML FOI INSERIDO NA PÁGINA
        setTimeout(() => {
            mapboxgl.accessToken = MAPBOX_TOKEN;
            const map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/navigation-day-v1',
                center: [(coordsOrigem.lon + coordsDestino.lon) / 2, (coordsOrigem.lat + coordsDestino.lat) / 2],
                zoom: 12
            });

            map.on('load', () => {
                // LINHA DE ROTA
                map.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: route.geometry
                    }
                });

                map.addLayer({
                    id: 'route',
                    type: 'line',
                    source: 'route',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#ff5500',
                        'line-width': 5
                    }
                });

                
                new mapboxgl.Marker({ color: 'green' })
                    .setLngLat([coordsOrigem.lon, coordsOrigem.lat])
                    .addTo(map);

                new mapboxgl.Marker({ color: 'red' })
                    .setLngLat([coordsDestino.lon, coordsDestino.lat])
                    .addTo(map);

                //PARTE DO ZOOM, NÃO MEXER EM NADA
                const bounds = new mapboxgl.LngLatBounds();
                route.geometry.coordinates.forEach(coord => bounds.extend(coord));
                map.fitBounds(bounds, { padding: 50 });
            });
        }, 200);

        return html;

    } catch (error) {
        console.error('Erro na busca de rota:', error);
        return `<p class="error">Erro ao buscar rota: ${error.message}</p>`;
    }
}