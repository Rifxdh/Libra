/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environmental parameters
dotenv.config();

import { BOOKS_DATABASE } from './src/data/books.ts';
import { TFIDFRecommendationEngine } from './src/utils/nlp.ts';
import { Book } from './src/types.ts';
import { generateLibraryDataset } from './src/data/generator.ts';

// Storage file path for user-imported book datasets
const STORE_PATH = path.join(process.cwd(), 'src', 'data', 'books_store.json');

let BOOKS_COLLECTION: Book[] = [];

try {
  if (fs.existsSync(STORE_PATH)) {
    const rawData = fs.readFileSync(STORE_PATH, 'utf8');
    BOOKS_COLLECTION = JSON.parse(rawData);
    console.log(`Loaded ${BOOKS_COLLECTION.length} books from books_store.json`);
  }
} catch (e) {
  console.error('Failed to load books_store.json, using default seed database', e);
}

// Ensure the dataset contains at least 1000 books as requested
if (BOOKS_COLLECTION.length < 1000) {
  console.log('Dataset contains less than 1000 books. Activating high-volume Libra generator...');
  try {
    const generatedBooks = generateLibraryDataset();
    BOOKS_COLLECTION = generatedBooks;
    fs.writeFileSync(STORE_PATH, JSON.stringify(BOOKS_COLLECTION, null, 2), 'utf8');
    console.log(`Successfully persisted and updated database with ${BOOKS_COLLECTION.length} realistic book collection items.`);
  } catch (err) {
    console.error('Failed to pre-generate books store:', err);
    if (BOOKS_COLLECTION.length === 0) {
      BOOKS_COLLECTION = [...BOOKS_DATABASE];
    }
  }
}

// Instantiate the TF-IDF Recommendation Engine once at startup
let recommendationEngine = new TFIDFRecommendationEngine(BOOKS_COLLECTION);

function getRandomGradient(idx: number): string {
  const gradients = [
    'from-blue-600 to-indigo-700',
    'from-purple-600 to-pink-700',
    'from-emerald-600 to-teal-700',
    'from-amber-500 to-orange-700',
    'from-red-600 to-rose-700',
    'from-cyan-600 to-blue-700',
    'from-teal-600 to-emerald-700',
    'from-indigo-600 to-violet-700',
    'from-rose-600 to-pink-700'
  ];
  return gradients[idx % gradients.length];
}

// Safe Lazy-loaded GoogleGenAI client builder
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        aiClient = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (err) {
        console.error('Failed to initialize GoogleGenAI client:', err);
      }
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON parsing with higher limit for bulk uploads
  app.use(express.json({ limit: '10mb' }));

  // API 1: Health status
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API 2: Books Database List
  app.get('/api/books', (req: Request, res: Response) => {
    res.json(BOOKS_COLLECTION);
  });

  // API 2.5: Import/Overwrite Books List via CSV upload
  app.post('/api/books/import', (req: Request, res: Response) => {
    const { books } = req.body;
    if (!Array.isArray(books)) {
      res.status(400).json({ error: 'Payload must be an array of books.' });
      return;
    }

    try {
      // Validate and assign structured values
      const validatedBooks: Book[] = books.map((b: any, index: number) => ({
        id: index + 1,
        judul: String(b.judul || 'Untitled Book').trim(),
        penulis: String(b.penulis || 'Anonim').trim(),
        kategori: b.kategori || 'Sains',
        sinopsis: String(b.sinopsis || 'Tidak ada deskripsi.').trim(),
        tahun: Number(b.tahun) || 2025,
        isbn: String(b.isbn || '000-000-000-0').trim(),
        halaman: Number(b.halaman) || 120,
        penerbit: String(b.penerbit || 'Penerbit Mandiri').trim(),
        gradient: b.gradient || getRandomGradient(index),
      }));

      BOOKS_COLLECTION = validatedBooks;

      // Persist to json file
      fs.writeFileSync(STORE_PATH, JSON.stringify(BOOKS_COLLECTION, null, 2), 'utf8');

      // Reinitialize the Recommendation Engine with the new books
      recommendationEngine = new TFIDFRecommendationEngine(BOOKS_COLLECTION);

      console.log(`Successfully imported ${BOOKS_COLLECTION.length} books and updated NLP engine.`);
      res.json({ success: true, count: BOOKS_COLLECTION.length, books: BOOKS_COLLECTION });
    } catch (e: any) {
      console.error('Failed to import books:', e);
      res.status(500).json({ error: 'Failed to process and store book dataset on the server.' });
    }
  });


  // API 3: Conversational Recommendation & Chatbot
  app.post('/api/chat', async (req: Request, res: Response) => {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message payload is required and must be a string.' });
      return;
    }

    try {
      // 1. Calculate Content-Based Recommendations with our custom NLP pipeline
      const recommendations = recommendationEngine.getRecommendations(message, 3, 0.05);

      // 2. Prepare context summaries for LLM prompt
      const hasRecommendations = recommendations.length > 0;
      const recsContextText = recommendations
        .map((r, i) => `${i + 1}. [ID: ${r.id}] "${r.judul}" oleh ${r.penulis} (Kategori: ${r.kategori}) - Kecocokan: ${r.percentage}%. Alasan: ${r.explanation}. Sinopsis: "${r.sinopsis}"`)
        .join('\n');

      const fullCatalogSummaryText = BOOKS_COLLECTION
        .map((b) => `- "${b.judul}" (${b.kategori}) oleh ${b.penulis}`)
        .join('\n');

      // 3. Attempt to generate conversational response via Gemini
      const gemini = getGeminiClient();
      let responseText = '';

      if (gemini) {
        const systemInstruction = `Anda adalah "Libra", sebuah virtual Asisten Rekomendasi Buku di perpustakaan kampus Universitas Pembangunan Jaya yang sangat elegan, ramah, intelektual, dan sopan.
Tugas Anda adalah memandu para mahasiswa dan akademisi menemukan koleksi buku terbaik kami secara natural dan deskriptif.

Aturan SANGAT Penting untuk Gaya Bahasa & Format:
1. JANGAN PERNAH menyebutkan istilah teknis pemrograman atau pencarian seperti "TF-IDF", "Cosine Similarity", "Content-Based Filtering", "algoritma matematika", "vector space", "kalkulasi backend", atau "indeksing" di dalam pesan Anda kepada pengguna.
2. Berikan narasi deskriptif yang elegan, hangat, dan mengalir natural untuk menjelaskan mengapa sebuah buku sangat cocok dan relevan dengan minat atau kueri pengguna. Fokuslah pada kedalaman tema buku, sinopsis, dan aspek keilmuannya.
3. Sebutkan tingkat keselarasan buku secara elegan dan manusiawi, misalnya: "Memiliki tingkat relevansi sekitar 85%" atau "buku ini sangat selaras (90%) dengan topik yang Anda cari...".
4. Gunakan format Markdown yang rapi dan minimalis. Anda dapat menggunakan cetak tebal seperti **judul buku** dan bullet points (* atau -) untuk daftar rekomendasi agar terstruktur dengan sangat indah. Hindari penggunaan tanda pagar banyak-banyak (seperti #, ##, ###) atau simbol-simbol dekoratif yang merusak kerapian teks jika tidak diperlukan. Buat respons Anda ramping, informatif, dan menyejukkan untuk dibaca.
5. JANGAN mengarang atau merekomendasikan judul buku fiktif di luar katalog internal perpustakaan! Hanya tawarkan atau diskusikan buku yang ada di katalog di bawah ini.
6. Selalu jaga kesopanan akademis yang ramah, dan tawarkan bantuan lain di akhir pesan Anda dengan anggun.

Katalog Buku Internal Perpustakaan:
${fullCatalogSummaryText}

Rekomendasi Relevansi Buku Terpilih untuk Membantu Anda:
${hasRecommendations ? recsContextText : 'Tidak ada kecocokan buku spesifik. Silakan tawarkan buku-buku relevan lainnya di katalog sesuai tema percakapan.'}
`;

        // Format history according to Gemini standards
        const apiContents: any[] = [];
        
        // Add context history (limit to last 6 chat turns to minimize token load)
        const recentHistory = (history || []).slice(-6);
        recentHistory.forEach((h: any) => {
          apiContents.push({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
          });
        });

        // Append current user message
        apiContents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        const modelOutput = await gemini.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: apiContents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
          }
        });

        responseText = modelOutput.text || '';
      }

      // If Gemini is not set or returned empty, trigger the deterministic fallback matching
      if (!responseText) {
        if (hasRecommendations) {
          const titles = recommendations.map((r) => `"${r.judul}" oleh ${r.penulis}`).join(', ');
          responseText = `Halo! Berdasarkan pencarian atau pertanyaan Anda mengenai topik tersebut, saya menemukan buku berikut yang sangat relevan: ${titles}. \n\nSistem mengidentifikasi keselarasan berdasarkan kandungan teks sinopsis dengan tingkat kecocokan yang signifikan. Apakah ada rincian atau kategori lain yang ingin Anda gali lebih lanjut?`;
        } else {
          responseText = `Halo! Terima kasih atas pertanyaannya. Saat ini saya belum menemukan koleksi buku di perpustakaan yang memiliki kecocokan tinggi (di atas batas 5%) dengan kata kunci tersebut. \n\nCobalah memasukkan kata kunci akademik lain seperti 'Python', 'basis data', 'metodologi riset', atau 'aljabar linear'. Saya akan dengan senang hati membantu Anda mencari referensi!`;
        }
      }

      // Respond directly to the client
      res.json({
        reply: responseText,
        recommendations: recommendations,
      });

    } catch (error) {
      console.error('Error handling chatbot request:', error);
      res.status(500).json({
        reply: 'Maaf, terjadi kesalahan internal sistem saat memproses kalkulasi similarity. Silakan ulangi sesaat lagi.',
        recommendations: [],
      });
    }
  });

  // Vite development integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted for development.');
  } else {
    // Serve production static files in dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static files from dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Libra backend running on port ${PORT}`);
  });
}

startServer();
