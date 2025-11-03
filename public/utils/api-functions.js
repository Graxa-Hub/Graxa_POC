// Função principal para buscar locais próximos a partir do CEP
async function buscarLocaisPorCep(cep) {
    try {
        // 1. Buscar endereço completo pelo CEP (retorna objeto com dados estruturados)
        const dadosCep = await getEnderecoViaCep(cep);

        // 2. Buscar restaurantes próximos usando dados do CEP
        const restaurantesHtml = await buscarRestaurantesReal(dadosCep);

        // 3. Buscar aeroporto próximo usando dados do CEP
        const aeroportoHtml = await buscarAeroportoReal(dadosCep);

        // 4. Buscar hotéis próximos (pode ser implementado similar aos restaurantes)
        const hoteisHtml = '<div class="result-item"><h4>Funcionalidade de hotéis em desenvolvimento</h4></div>';

        // 5. Retornar resultado agrupado
        return {
            endereco: dadosCep.enderecoCompleto,
            restaurantes: restaurantesHtml,
            aeroporto: aeroportoHtml,
            hoteis: hoteisHtml
        };
    } catch (error) {
        console.error('Erro ao buscar locais por CEP:', error);
        throw error;
    }
}

// 🔹 Buscar endereço completo via ViaCEP (RETORNA OBJETO COM DADOS ESTRUTURADOS)
async function getEnderecoViaCep(cep) {
  const url = `https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.erro) throw new Error('CEP não encontrado');
    
    // Retorna objeto com dados estruturados E string formatada
    return {
        cep: data.cep,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        localidade: data.localidade || '',
        uf: data.uf || '',
        // String formatada para exibição
        enderecoCompleto: `${data.logradouro || ''} ${data.bairro || ''} ${data.localidade || ''} ${data.uf || ''} Brasil ${data.cep || cep}`
            .replace(/ +/g, ' ')
            .trim(),
        // String otimizada para busca (cidade + estado + Brasil)
        enderecoParaBusca: `${data.localidade || ''}, ${data.uf || ''}, Brasil`.trim()
    };
  } catch (error) {
    console.error('Erro ao buscar endereço ViaCEP:', error);
    throw error;
  }
}

// 🔹 Obter coordenadas pelo endereço (Mapbox) - ATUALIZADA
async function getCoordinates(dadosCep) {
  const accessToken = 'pk.eyJ1IjoiZ2FicmllbHNvdXNhLXNwdGVjaCIsImEiOiJjbWZ5N2ZzaGwwaHp2MmpwemFtczJib3YzIn0.opNfyOXGWBuKl1R4iJiSOQ';
  
  // Usa enderecoParaBusca se for objeto, senão usa string direta
  const endereco = typeof dadosCep === 'object' ? dadosCep.enderecoParaBusca : dadosCep;
  
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(endereco)}.json?access_token=${accessToken}&limit=1`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.features || !data.features.length) throw new Error('Endereço não encontrado');
  
  const f = data.features[0];
  return { 
      lat: f.center[1], 
      lon: f.center[0], 
      display_name: f.place_name 
  };
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

// 🔹 FUNÇÃO PARA CONFIGURAR EVENT LISTENERS DOS RESTAURANTES
function configurarClickRestaurantes() {
    // Usar event delegation no documento para capturar cliques em restaurantes
    document.addEventListener('click', async function(e) {
        const restauranteItem = e.target.closest('.restaurante-clicavel');
        
        if (restauranteItem) {
            try {
                // Extrair dados do restaurante e origem (decodificar HTML entities)
                const dadosRestauranteStr = restauranteItem.getAttribute('data-restaurante')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");
                const dadosOrigemStr = restauranteItem.getAttribute('data-origem')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");
                
                const dadosRestaurante = JSON.parse(dadosRestauranteStr);
                const dadosOrigem = JSON.parse(dadosOrigemStr);
                
                console.log('Buscando rota para:', dadosRestaurante.nome);
                
                // Fechar modal atual e abrir modal do mapa
                fecharModal();
                
                // Abrir modal do mapa e aguardar um pouco para garantir que está renderizado
                setTimeout(async () => {
                    abrirModal('mapa');
                    
                    // Aguardar modal renderizar
                    setTimeout(async () => {
                        // Preencher os campos de origem e destino
                        const origemInput = document.getElementById('endereco-origem');
                        const destinoInput = document.getElementById('endereco-destino');
                        
                        if (origemInput && destinoInput) {
                            // Montar endereço de origem baseado nos dados disponíveis
                            const enderecoOrigem = dadosOrigem.enderecoCompleto || 
                                                   dadosOrigem.enderecoParaBusca || 
                                                   `${dadosOrigem.localidade || ''}${dadosOrigem.uf ? '/' + dadosOrigem.uf : ''}` ||
                                                   'Endereço de origem';
                            
                            origemInput.value = enderecoOrigem;
                            destinoInput.value = dadosRestaurante.endereco;
                        }
                        
                        // Buscar a rota
                        const resultsContent = document.getElementById('results-content');
                        const resultsContainer = document.getElementById('results-container');
                        
                        if (resultsContent) {
                            resultsContent.innerHTML = '<p>Carregando rota para o restaurante...</p>';
                            resultsContainer.style.display = 'block';
                        }
                        
                        const rotaHtml = await buscarRotaReal(dadosOrigem, dadosRestaurante);
                        
                        if (resultsContent) {
                            resultsContent.innerHTML = rotaHtml;
                            resultsContainer.style.display = 'block';
                        }
                    }, 100);
                }, 100);
                
            } catch (error) {
                console.error('Erro ao buscar rota para restaurante:', error);
                alert('Erro ao buscar rota: ' + error.message);
            }
        }
    });
}

// Chamar esta função quando a página carregar
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', configurarClickRestaurantes);
    } else {
        configurarClickRestaurantes();
    }
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

// 🔹 Função para buscar aeroportos próximos - ATUALIZADA PARA USAR DADOS DO CEP
async function buscarAeroportoReal(dadosCep) {
    try {
        // Obter coordenadas usando os dados estruturados do CEP
        const coords = await getCoordinates(dadosCep);
        
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
            
            // Criar objeto com dados do aeroporto para passar na rota
            const dadosAeroporto = {
                nome: aeroportoMaisProximo.nome,
                endereco: enderecoAeroporto,
                lat: aeroportoMaisProximo.lat,
                lon: aeroportoMaisProximo.lon,
                sigla: aeroportoMaisProximo.sigla
            };
            
            // Escapar caracteres especiais para evitar erro no JSON
            const dadosAeroportoStr = JSON.stringify(dadosAeroporto).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            const dadosCepStr = JSON.stringify(dadosCep).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            
            return `
                <div class="result-item aeroporto-clicavel" 
                     data-aeroporto="${dadosAeroportoStr}"
                     data-origem="${dadosCepStr}"
                     style="cursor: pointer; transition: all 0.3s ease;">
                    <h4>${aeroportoMaisProximo.nome}</h4>
                    <p><strong>Sigla:</strong> ${aeroportoMaisProximo.sigla}</p>
                    <p><strong>Endereço:</strong> ${enderecoAeroporto}</p>
                    <p><strong>Distância:</strong> ${aeroportoMaisProximo.distancia.toFixed(1)} km</p>
                    <p><em>Distância calculada a partir de ${dadosCep.localidade}/${dadosCep.uf}</em></p>
                    <p style="color: #34a853; font-size: 0.9em; margin-top: 8px;">
                        <strong>✈️ Clique para ver a rota no mapa</strong>
                    </p>
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

// 🔹 Função para buscar restaurantes próximos - ATUALIZADA PARA USAR DADOS DO CEP
async function buscarRestaurantesReal(dadosCep) {
    try {
        // Obter coordenadas usando os dados estruturados do CEP
        const coords = await getCoordinates(dadosCep);
        
        const accessToken = 'pk.eyJ1IjoiZ2FicmllbHNvdXNhLXNwdGVjaCIsImEiOiJjbWZ5N2ZzaGwwaHp2MmpwemFtczJib3YzIn0.opNfyOXGWBuKl1R4iJiSOQ';
        const url = `https://api.mapbox.com/search/searchbox/v1/category/restaurant?proximity=${coords.lon},${coords.lat}&limit=3&access_token=${accessToken}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            return data.features.map((rest, index) => {
                const nome = rest.properties.name || rest.text || 'Restaurante';
                const endereco = rest.properties.address || rest.place_formatted || 'Endereço não disponível';
                const distancia = rest.properties.distance ? 
                    (rest.properties.distance / 1000) : 
                    calculateDistance(coords.lat, coords.lon, rest.geometry.coordinates[1], rest.geometry.coordinates[0]);
                
                // Criar objeto com dados do restaurante para passar na rota
                const dadosRestaurante = {
                    nome: nome,
                    endereco: endereco,
                    lat: rest.geometry.coordinates[1],
                    lon: rest.geometry.coordinates[0]
                };
                
                // Escapar caracteres especiais para evitar erro no JSON
                const dadosRestauranteStr = JSON.stringify(dadosRestaurante).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
                const dadosCepStr = JSON.stringify(dadosCep).replace(/'/g, "&#39;").replace(/"/g, "&quot;");
                
                return `
                    <div class="result-item restaurante-clicavel" 
                         data-restaurante="${dadosRestauranteStr}"
                         data-origem="${dadosCepStr}"
                         style="cursor: pointer; transition: all 0.3s ease;">
                        <h4>${nome}</h4>
                        <p><strong>Endereço:</strong> ${endereco}</p>
                        <p><strong>Distância:</strong> ${distancia.toFixed(1)} km</p>
                        <p style="color: #007bff; font-size: 0.9em; margin-top: 8px;">
                            <strong>👆 Clique para ver a rota no mapa</strong>
                        </p>
                    </div>
                `;
            }).join('');
        }
        
        // Fallback com dados simulados se não encontrar restaurantes
        return `
            <div class="result-item">
                <h4>Restaurante Bella Vista</h4>
                <p><strong>Endereço:</strong> Rua das Flores, 123 - ${dadosCep.bairro || 'Centro'}</p>
                <p><strong>Distância:</strong> 1.2 km</p>
            </div>
            <div class="result-item">
                <h4>Pizzaria do João</h4>
                <p><strong>Endereço:</strong> Av. Principal, 456 - ${dadosCep.bairro || 'Jardim'}</p>
                <p><strong>Distância:</strong> 2.1 km</p>
            </div>
            <div class="result-item">
                <h4>Churrascaria Gaúcha</h4>
                <p><strong>Endereço:</strong> Rua do Comércio, 789 - Vila Nova</p>
                <p><strong>Distância:</strong> 3.5 km</p>
            </div>
            <p><em>Dados de exemplo para ${dadosCep.localidade}/${dadosCep.uf}</em></p>
        `;
    } catch (error) {
        console.error('Erro na busca de restaurantes:', error);
        throw new Error('Erro ao buscar restaurantes: ' + error.message);
    }
}

// 🔹 Função para buscar rota - ATUALIZADA PARA ACEITAR DADOS DO CEP E COORDENADAS DIRETAS
async function buscarRotaReal(origem, destino) {
    const MAPBOX_TOKEN = 'pk.eyJ1IjoiZ2FicmllbHNvdXNhLXNwdGVjaCIsImEiOiJjbWZ5N2ZzaGwwaHp2MmpwemFtczJib3YzIn0.opNfyOXGWBuKl1R4iJiSOQ';

    try {
        let coordsOrigem, coordsDestino, nomeOrigem, nomeDestino;

        // Verificar se origem já tem coordenadas (lat/lon)
        if (origem.lat && origem.lon) {
            coordsOrigem = { lat: origem.lat, lon: origem.lon, display_name: origem.endereco || 'Origem' };
            nomeOrigem = origem.localidade ? `${origem.localidade}/${origem.uf}` : 'Sua localização';
        } else {
            coordsOrigem = await getCoordinates(origem);
            nomeOrigem = typeof origem === 'object' ? `${origem.localidade}/${origem.uf}` : origem;
        }

        // Verificar se destino já tem coordenadas (restaurante)
        if (destino.lat && destino.lon) {
            coordsDestino = { lat: destino.lat, lon: destino.lon, display_name: destino.endereco };
            nomeDestino = destino.nome || 'Restaurante';
        } else {
            coordsDestino = await getCoordinates(destino);
            nomeDestino = typeof destino === 'object' ? `${destino.localidade}/${destino.uf}` : destino;
        }

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
            <p>Rota de <strong>${nomeOrigem}</strong> até <strong>${nomeDestino}</strong></p>
            <p><strong>Distância:</strong> ${distanceKm} km</p>
            <p><strong>Tempo estimado:</strong> ${durationMin} minutos</p>
            <p><strong>Origem:</strong> ${coordsOrigem.display_name}</p>
            <p><strong>Destino:</strong> ${coordsDestino.display_name}</p>
        `;

        // Inicializar mapa após garantir que HTML está na página
        setTimeout(() => {
            mapboxgl.accessToken = MAPBOX_TOKEN;
            const map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/dark-v11',
                center: [(coordsOrigem.lon + coordsDestino.lon) / 2, (coordsOrigem.lat + coordsDestino.lat) / 2],
                zoom: 12
            });

            map.on('load', () => {
                // Adicionar linha de rota
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

                // Adicionar marcadores
                new mapboxgl.Marker({ color: 'green' })
                    .setLngLat([coordsOrigem.lon, coordsOrigem.lat])
                    .addTo(map);

                new mapboxgl.Marker({ color: 'red' })
                    .setLngLat([coordsDestino.lon, coordsDestino.lat])
                    .addTo(map);

                // Ajustar zoom para mostrar toda a rota
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