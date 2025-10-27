const express = require('express');
const app = express();
const PORT = 3001; // PORTA AJUSTADA PARA 3001

const aeroportos = [
  { nome: "Aeroporto de Guarulhos", iata: "GRU", lat: -23.4356, lon: -46.4731 },
  { nome: "Aeroporto de Congonhas", iata: "CGH", lat: -23.6261, lon: -46.6566 },
  { nome: "Aeroporto do Galeão", iata: "GIG", lat: -22.8099, lon: -43.2506 },
  { nome: "Aeroporto de Brasília", iata: "BSB", lat: -15.8711, lon: -47.9186 },
  { nome: "Aeroporto de Confins", iata: "CNF", lat: -19.6337, lon: -43.9687 },
  { nome: "Aeroporto de Viracopos", iata: "VCP", lat: -23.0067, lon: -47.1344 },
  { nome: "Aeroporto de Recife/Guararapes", iata: "REC", lat: -8.1268, lon: -34.9230 },
  { nome: "Aeroporto de Salvador", iata: "SSA", lat: -12.9100, lon: -38.3310 },
  { nome: "Aeroporto de Porto Alegre", iata: "POA", lat: -29.9944, lon: -51.1714 },
  { nome: "Aeroporto de Fortaleza", iata: "FOR", lat: -3.7763, lon: -38.5326 },
  { nome: "Aeroporto de Curitiba", iata: "CWB", lat: -25.5285, lon: -49.1758 },
  { nome: "Aeroporto de Santos Dumont", iata: "SDU", lat: -22.9105, lon: -43.1631 },
  { nome: "Aeroporto de Belém/Val de Cans", iata: "BEL", lat: -1.3792, lon: -48.4763 },
  { nome: "Aeroporto de Manaus/Eduardo Gomes", iata: "MAO", lat: -3.0386, lon: -60.0497 },
  { nome: "Aeroporto de Florianópolis", iata: "FLN", lat: -27.6705, lon: -48.5525 },
  { nome: "Aeroporto de Goiânia", iata: "GYN", lat: -16.6320, lon: -49.2260 },
  { nome: "Aeroporto de Vitória", iata: "VIX", lat: -20.2581, lon: -40.2864 },
  { nome: "Aeroporto de Maceió", iata: "MCZ", lat: -9.5108, lon: -35.7923 },
  { nome: "Aeroporto de João Pessoa", iata: "JPA", lat: -7.1464, lon: -34.9486 },
  { nome: "Aeroporto de Natal", iata: "NAT", lat: -5.7681, lon: -35.3659 },
  { nome: "Aeroporto de São Luís", iata: "SLZ", lat: -2.5854, lon: -44.2341 },
  { nome: "Aeroporto de Cuiabá", iata: "CGB", lat: -15.6529, lon: -56.1172 },
  { nome: "Aeroporto de Campo Grande", iata: "CGR", lat: -20.4687, lon: -54.6725 },
  { nome: "Aeroporto de Macapá", iata: "MCP", lat: 0.0507, lon: -51.0722 },
  { nome: "Aeroporto de Teresina", iata: "THE", lat: -5.0631, lon: -42.8235 },
  { nome: "Aeroporto de Porto Seguro", iata: "BPS", lat: -16.4386, lon: -39.0809 },
  { nome: "Aeroporto de Navegantes", iata: "NVT", lat: -26.8797, lon: -48.6507 },
  { nome: "Aeroporto de Foz do Iguaçu", iata: "IGU", lat: -25.5942, lon: -54.4872 }
];

function haversine(lat1, lon1, lat2, lon2) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

app.get('/aeroporto-mais-proximo', (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: "Forneça lat e lon na query string." });
  }
  let maisProximo = null;
  let menorDistancia = Infinity;

  aeroportos.forEach(aeroporto => {
    const dist = haversine(Number(lat), Number(lon), aeroporto.lat, aeroporto.lon);
    if (dist < menorDistancia) {
      menorDistancia = dist;
      maisProximo = aeroporto;
    }
  });

  if (maisProximo) {
    res.json({ aeroporto: maisProximo, distancia_km: menorDistancia });
  } else {
    res.status(404).json({ error: "Nenhum aeroporto encontrado." });
  }
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});