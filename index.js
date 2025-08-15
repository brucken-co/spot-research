// ====================================
// ROUTES - DEBUG
// ====================================

app.get('/api/debug/search', ensureSpotifyAuth, async (req, res) => {
  try {
    const { q = 'test' } = req.query;

    console.log(`DEBUG: Buscando "${q}" com token: ${req.spotifyToken.substring(0, 10)}...`);

    // Teste 1: Busca mais simples possível
    const response = await axios.get(`${SPOTIFY_API_BASE}/search`, {
      headers: {
        'Authorization': `Bearer ${req.spotifyToken}`
      },
      params: {
        q: q,
        type: 'track',
        limit: 1  // Apenas 1 resultado
      }
    });

    console.log('DEBUG: Busca bem-sucedida!');

    res.json({
      success: true,
      debug: true,
      query: q,
      token_prefix: req.spotifyToken.substring(0, 10),
      total_found: response.data.tracks.total,
      first_track: response.data.tracks.items[0] ? {
        id: response.data.tracks.items[0].id,
        name: response.data.tracks.items[0].name,
        artist: response.data.tracks.items[0].artists[0].name
      } : null,
      raw_response_keys: Object.keys(response.data)
    });

  } catch (error) {
    console.error('DEBUG: Erro detalhado:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });

    res.status(500).json({
      success: false,
      debug: true,
      error: 'Erro na busca debug',
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      }
    });
  }
});

// ====================================
// ROUTES - DEBUG
// ====================================

app.get('/api/debug/search', ensureSpotifyAuth, async (req, res) => {
  try {
    const { q = 'test' } = req.query;

    console.log(`DEBUG: Buscando "${q}" com token: ${req.spotifyToken.substring(0, 10)}...`);

    // Teste 1: Busca mais simples possível
    const response = await axios.get(`${SPOTIFY_API_BASE}/search`, {
      headers: {
        'Authorization': `Bearer ${req.spotifyToken}`
      },
      params: {
        q: q,
        type: 'track',
        limit: 1  // Apenas 1 resultado
      }
    });

    console.log('DEBUG: Busca bem-sucedida!');

    res.json({
      success: true,
      debug: true,
      query: q,
      token_prefix: req.spotifyToken.substring(0, 10),
      total_found: response.data.tracks.total,
      first_track: response.data.tracks.items[0] ? {
        id: response.data.tracks.items[0].id,
        name: response.data.tracks.items[0].name,
        artist: response.data.tracks.items[0].artists[0].name
      } : null,
      raw_response_keys: Object.keys(response.data)
    });

  } catch (error) {
    console.error('DEBUG: Erro detalhado:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });

    res.status(500).json({
      success: false,
      debug: true,
      error: 'Erro na busca debug',
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      }
    });
  }
});

// ====================================
// SERVIDOR BACKEND - SPOTIFY RESEARCH
// Configurado para Render.com
// ====================================

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ====================================
// MIDDLEWARE
// ====================================

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ====================================
// SPOTIFY CONFIGURATION
// ====================================

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Token cache
let spotifyToken = null;
let tokenExpiry = null;

// ====================================
// SPOTIFY AUTH FUNCTIONS
// ====================================

async function getSpotifyToken() {
  try {
    // Verificar se token ainda é válido
    if (spotifyToken && tokenExpiry && Date.now() < tokenExpiry) {
      return spotifyToken;
    }

    console.log('Obtendo novo token do Spotify...');

    const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post(SPOTIFY_TOKEN_URL, 
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    spotifyToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Renovar 1 min antes

    console.log('Token obtido com sucesso!');
    return spotifyToken;

  } catch (error) {
    console.error('Erro ao obter token do Spotify:', error.response?.data || error.message);
    throw new Error('Falha na autenticação com Spotify');
  }
}

// Middleware para verificar token
async function ensureSpotifyAuth(req, res, next) {
  try {
    req.spotifyToken = await getSpotifyToken();
    next();
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro de autenticação com Spotify',
      details: error.message 
    });
  }
}

// ====================================
// ROUTES - HEALTH CHECK
// ====================================

app.get('/', (req, res) => {
  res.json({ 
    message: 'Spotify Research API',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth/test',
      search: '/api/search?q={query}',
      audioFeatures: '/api/audio-features?ids={track_ids}',
      recommendations: '/api/recommendations?seed_tracks={track_id}'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: {
      node_version: process.version,
      port: PORT,
      spotify_configured: !!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET)
    }
  });
});

// ====================================
// ROUTES - SPOTIFY AUTH
// ====================================

app.post('/api/auth/test', async (req, res) => {
  try {
    const token = await getSpotifyToken();
    
    // Testar token fazendo uma requisição simples
    const testResponse = await axios.get(`${SPOTIFY_API_BASE}/browse/categories?limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    res.json({
      success: true,
      message: 'Autenticação com Spotify funcionando!',
      token_valid: true,
      test_data: testResponse.data
    });

  } catch (error) {
    console.error('Erro no teste de auth:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Erro na autenticação',
      details: error.response?.data || error.message
    });
  }
});

// ====================================
// ROUTES - SEARCH
// ====================================

app.get('/api/search', ensureSpotifyAuth, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" é obrigatório' });
    }

    console.log(`Buscando: "${q}"`);

    const response = await axios.get(`${SPOTIFY_API_BASE}/search`, {
      headers: {
        'Authorization': `Bearer ${req.spotifyToken}`
      },
      params: {
        q: q,
        type: 'track',
        limit: limit
        // Removido market para evitar erro 403
      }
    });

    const tracks = response.data.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      image: track.album.images[0]?.url || null,
      preview_url: track.preview_url,
      external_urls: track.external_urls,
      popularity: track.popularity
    }));

    res.json({
      success: true,
      query: q,
      total: response.data.tracks.total,
      tracks: tracks
    });

  } catch (error) {
    console.error('Erro na busca:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Erro na busca',
      details: error.response?.data || error.message
    });
  }
});

// ====================================
// ROUTES - AUDIO FEATURES
// ====================================

app.get('/api/audio-features', ensureSpotifyAuth, async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ error: 'Query parameter "ids" é obrigatório' });
    }

    console.log(`Obtendo audio features para: ${ids}`);

    const response = await axios.get(`${SPOTIFY_API_BASE}/audio-features`, {
      headers: {
        'Authorization': `Bearer ${req.spotifyToken}`
      },
      params: { ids: ids }
    });

    res.json({
      success: true,
      audio_features: response.data.audio_features
    });

  } catch (error) {
    console.error('Erro ao obter audio features:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter características musicais',
      details: error.response?.data || error.message
    });
  }
});

// ====================================
// ROUTES - RECOMMENDATIONS
// ====================================

app.get('/api/recommendations', ensureSpotifyAuth, async (req, res) => {
  try {
    const { 
      seed_tracks, 
      seed_artists, 
      seed_genres,
      limit = 15,
      market = 'BR',
      target_energy,
      target_danceability,
      target_valence,
      target_acousticness,
      target_instrumentalness,
      target_tempo
    } = req.query;

    if (!seed_tracks && !seed_artists && !seed_genres) {
      return res.status(400).json({ 
        error: 'Pelo menos um seed (tracks, artists, ou genres) é obrigatório' 
      });
    }

    console.log(`Gerando recomendações com seed_tracks: ${seed_tracks}`);

    const params = {
      limit: limit,
      market: market
    };

    // Adicionar seeds
    if (seed_tracks) params.seed_tracks = seed_tracks;
    if (seed_artists) params.seed_artists = seed_artists;
    if (seed_genres) params.seed_genres = seed_genres;

    // Adicionar targets se fornecidos
    if (target_energy) params.target_energy = target_energy;
    if (target_danceability) params.target_danceability = target_danceability;
    if (target_valence) params.target_valence = target_valence;
    if (target_acousticness) params.target_acousticness = target_acousticness;
    if (target_instrumentalness) params.target_instrumentalness = target_instrumentalness;
    if (target_tempo) params.target_tempo = target_tempo;

    const response = await axios.get(`${SPOTIFY_API_BASE}/recommendations`, {
      headers: {
        'Authorization': `Bearer ${req.spotifyToken}`
      },
      params: params
    });

    const recommendations = response.data.tracks.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      image: track.album.images[0]?.url || null,
      preview_url: track.preview_url,
      external_urls: track.external_urls,
      popularity: track.popularity
    }));

    res.json({
      success: true,
      total: recommendations.length,
      seeds: response.data.seeds,
      recommendations: recommendations
    });

  } catch (error) {
    console.error('Erro nas recomendações:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar recomendações',
      details: error.response?.data || error.message
    });
  }
});

// ====================================
// ROUTE COMBINADA - SEARCH + AUDIO FEATURES
// ====================================

app.get('/api/search-with-features', ensureSpotifyAuth, async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" é obrigatório' });
    }

    console.log(`Busca completa: "${q}"`);

    // 1. Buscar tracks
    const searchResponse = await axios.get(`${SPOTIFY_API_BASE}/search`, {
      headers: {
        'Authorization': `Bearer ${req.spotifyToken}`
      },
      params: {
        q: q,
        type: 'track',
        limit: limit
        // Removido market para evitar erro 403
      }
    });

    const tracks = searchResponse.data.tracks.items;
    
    if (tracks.length === 0) {
      return res.json({
        success: true,
        query: q,
        tracks: []
      });
    }

    // 2. Obter audio features
    const trackIds = tracks.map(track => track.id).join(',');
    const featuresResponse = await axios.get(`${SPOTIFY_API_BASE}/audio-features`, {
      headers: {
        'Authorization': `Bearer ${req.spotifyToken}`
      },
      params: { ids: trackIds }
    });

    // 3. Combinar dados
    const tracksWithFeatures = tracks.map((track, index) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      image: track.album.images[0]?.url || null,
      preview_url: track.preview_url,
      external_urls: track.external_urls,
      popularity: track.popularity,
      audio_features: featuresResponse.data.audio_features[index]
    }));

    res.json({
      success: true,
      query: q,
      total: searchResponse.data.tracks.total,
      tracks: tracksWithFeatures
    });

  } catch (error) {
    console.error('Erro na busca completa:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Erro na busca completa',
      details: error.response?.data || error.message
    });
  }
});

// ====================================
// ROUTE COMBINADA - RECOMMENDATIONS + AUDIO FEATURES
// ====================================

app.get('/api/recommendations-with-features', ensureSpotifyAuth, async (req, res) => {
  try {
    const { 
      seed_tracks,
      limit = 15,
      market = 'BR',
      target_energy,
      target_danceability,
      target_valence,
      target_acousticness,
      target_instrumentalness,
      target_tempo
    } = req.query;

    if (!seed_tracks) {
      return res.status(400).json({ error: 'seed_tracks é obrigatório' });
    }

    console.log(`Recomendações completas para: ${seed_tracks}`);

    const params = {
      seed_tracks: seed_tracks,
      limit: limit,
      market: market
    };

    // Adicionar targets se fornecidos
    if (target_energy) params.target_energy = target_energy;
    if (target_danceability) params.target_danceability = target_danceability;
    if (target_valence) params.target_valence = target_valence;
    if (target_acousticness) params.target_acousticness = target_acousticness;
    if (target_instrumentalness) params.target_instrumentalness = target_instrumentalness;
    if (target_tempo) params.target_tempo = target_tempo;

    // 1. Obter recomendações
    const recResponse = await axios.get(`${SPOTIFY_API_BASE}/recommendations`, {
      headers: {
        'Authorization': `Bearer ${req.spotifyToken}`
      },
      params: params
    });

    const tracks = recResponse.data.tracks;
    
    if (tracks.length === 0) {
      return res.json({
        success: true,
        recommendations: []
      });
    }

    // 2. Obter audio features
    const trackIds = tracks.map(track => track.id).join(',');
    const featuresResponse = await axios.get(`${SPOTIFY_API_BASE}/audio-features`, {
      headers: {
        'Authorization': `Bearer ${req.spotifyToken}`
      },
      params: { ids: trackIds }
    });

    // 3. Calcular similaridade (se seed_track fornecido)
    let seedFeatures = null;
    if (seed_tracks) {
      try {
        const seedResponse = await axios.get(`${SPOTIFY_API_BASE}/audio-features/${seed_tracks}`, {
          headers: {
            'Authorization': `Bearer ${req.spotifyToken}`
          }
        });
        seedFeatures = seedResponse.data;
      } catch (e) {
        console.log('Não foi possível obter features da seed track');
      }
    }

    // 4. Combinar dados
    const recommendationsWithFeatures = tracks.map((track, index) => {
      const features = featuresResponse.data.audio_features[index];
      let similarity = null;

      // Calcular similaridade se temos as features da seed
      if (seedFeatures && features) {
        const energyDiff = Math.abs(features.energy - seedFeatures.energy);
        const danceabilityDiff = Math.abs(features.danceability - seedFeatures.danceability);
        const valenceDiff = Math.abs(features.valence - seedFeatures.valence);
        const acousticnessDiff = Math.abs(features.acousticness - seedFeatures.acousticness);
        
        const avgDiff = (energyDiff + danceabilityDiff + valenceDiff + acousticnessDiff) / 4;
        similarity = Math.max(70, Math.round((1 - avgDiff) * 100));
      }

      return {
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        image: track.album.images[0]?.url || null,
        preview_url: track.preview_url,
        external_urls: track.external_urls,
        popularity: track.popularity,
        audio_features: features,
        similarity: similarity
      };
    });

    // Ordenar por similaridade se calculada
    if (seedFeatures) {
      recommendationsWithFeatures.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    }

    res.json({
      success: true,
      total: recommendationsWithFeatures.length,
      seed_features: seedFeatures,
      recommendations: recommendationsWithFeatures
    });

  } catch (error) {
    console.error('Erro nas recomendações completas:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Erro ao gerar recomendações completas',
      details: error.response?.data || error.message
    });
  }
});

// ====================================
// ERROR HANDLING
// ====================================

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    available_endpoints: [
      'GET /',
      'GET /health',
      'POST /api/auth/test',
      'GET /api/search?q={query}',
      'GET /api/audio-features?ids={track_ids}',
      'GET /api/recommendations?seed_tracks={track_id}',
      'GET /api/search-with-features?q={query}',
      'GET /api/recommendations-with-features?seed_tracks={track_id}',
      'GET /api/debug/search?q={query}'
    ]
  });
});

app.use((error, req, res, next) => {
  console.error('Erro interno:', error);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// ====================================
// START SERVER
// ====================================

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🎵 Spotify configurado: ${!!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET)}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ====================================
// GRACEFUL SHUTDOWN
// ====================================

process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});