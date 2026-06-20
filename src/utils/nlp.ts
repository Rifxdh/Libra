/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Book, RecommendationExtended } from '../types.js';

// Comprehensive listing of common Indonesian stopwords
export const INDONESIAN_STOPWORDS = new Set([
  'dan', 'atau', 'di', 'ke', 'dari', 'yang', 'untuk', 'dengan', 'ini', 'itu',
  'adalah', 'ia', 'mereka', 'kita', 'kamu', 'saya', 'akan', 'telah', 'bisa',
  'dapat', 'menggunakan', 'sebagai', 'dalam', 'pada', 'oleh', 'buku', 'membahas',
  'konsep', 'memahami', 'panduan', 'praktis', 'serta', 'sistem', 'dasar', 'secara',
  'mengenai', 'tentang', 'hingga', 'tingkat', 'banyak', 'beberapa', 'maupun',
  'kami', 'dia', 'tersebut', 'bila', 'jika', 'agar', 'supaya', 'bagi', 'adapun',
  'atau', 'bahkan', 'bahwa', 'belum', 'bisa', 'boleh', 'dan', 'dari', 'dengan',
  'dia', 'dimana', 'dan', 'di', 'ke', 'dari'
]);

/**
 * Basic Indonesian Stemmer implementing lightweight confix stripping rules.
 */
export function stemIndonesian(word: string): string {
  let w = word.trim().toLowerCase();
  if (w.length <= 3) return w;

  // 1. Remove inflection particles: -kah, -lah, -pun
  if (w.endsWith('kah') || w.endsWith('lah') || w.endsWith('pun')) {
    w = w.slice(0, -3);
  }

  // 2. Remove possessive pronouns: -ku, -mu, -nya
  if (w.endsWith('ku') || w.endsWith('mu')) {
    if (w.length > 4) w = w.slice(0, -2);
  } else if (w.endsWith('nya')) {
    if (w.length > 5) w = w.slice(0, -3);
  }

  // 3. Remove derivational suffixes: -kan, -an, -i
  if (w.endsWith('kan')) {
    if (w.length > 5) w = w.slice(0, -3);
  } else if (w.endsWith('an')) {
    if (w.length > 4) w = w.slice(0, -2);
  } else if (w.endsWith('i')) {
    // Avoid stripping 'i' from words like 'murni', 'teori', 'stud-i'
    if (w.length > 4 && !w.endsWith('si') && !w.endsWith('ri') && !w.endsWith('li')) {
      w = w.slice(0, -1);
    }
  }

  // 4. Remove derivational prefixes: me-, be-, pe-, di-, ke-, se-, te-
  if (w.startsWith('di') || w.startsWith('ke') || w.startsWith('se')) {
    if (w.length > 4) w = w.slice(2);
  } else if (w.startsWith('ber')) {
    if (w.length > 5) w = w.slice(3);
  } else if (w.startsWith('be')) {
    if (w.length > 4) w = w.slice(2);
  } else if (w.startsWith('ter')) {
    if (w.length > 5) w = w.slice(3);
  } else if (w.startsWith('te')) {
    if (w.length > 4) w = w.slice(2);
  } else if (w.startsWith('meng')) {
    if (w.length > 6) w = w.slice(4);
  } else if (w.startsWith('meny')) {
    // menyisir -> sisir
    if (w.length > 5) w = 's' + w.slice(4);
  } else if (w.startsWith('men')) {
    if (w.length > 5) w = w.slice(3);
  } else if (w.startsWith('mem')) {
    if (w.length > 5) {
      const rest = w.slice(3);
      if (rest.startsWith('p') || rest.startsWith('b')) {
        w = rest;
      } else {
        w = 'p' + rest;
      }
    }
  } else if (w.startsWith('me')) {
    if (w.length > 4) w = w.slice(2);
  } else if (w.startsWith('peng') || w.startsWith('peny') || w.startsWith('pen') || w.startsWith('pem') || w.startsWith('pe')) {
    if (w.startsWith('peng')) {
      if (w.length > 6) w = w.slice(4);
    } else if (w.startsWith('peny')) {
      if (w.length > 5) w = 's' + w.slice(4);
    } else if (w.startsWith('pen')) {
      if (w.length > 5) w = w.slice(3);
    } else if (w.startsWith('pem')) {
      if (w.length > 5) {
        const rest = w.slice(3);
        if (rest.startsWith('p') || rest.startsWith('b')) {
          w = rest;
        } else {
          w = 'p' + rest;
        }
      }
    } else if (w.startsWith('pe')) {
      if (w.length > 4) w = w.slice(2);
    }
  }

  return w;
}

/**
 * Preprocesses a dynamic string by performing lower-casing, special character
 * scrubbing, stopword removal, and Indonesian word stemming.
 */
export function preprocessText(text: string): string[] {
  if (!text) return [];
  
  // Case folding and sanitization
  const clean = text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/);

  // Stopword removal and Indonesian Stemming
  const words: string[] = [];
  for (const token of clean) {
    if (token.length > 1 && !INDONESIAN_STOPWORDS.has(token)) {
      const stemmed = stemIndonesian(token);
      if (stemmed && stemmed.length > 1) {
        words.push(stemmed);
      }
    }
  }
  
  return words;
}

/**
 * Performs custom TF-IDF (Term Frequency - Inverse Document Frequency) mapping
 * and Cosine Similarity computations.
 */
export class TFIDFRecommendationEngine {
  private corpus: string[][] = [];
  private books: Book[] = [];
  private vocabulary: string[] = [];
  private idf: { [key: string]: number } = {};
  private documentVectors: number[][] = [];

  constructor(books: Book[]) {
    this.books = books;
    this.buildVectors();
  }

  private buildVectors() {
    this.corpus = this.books.map((b) => {
      // Create comprehensive metadata string containing title, author, category, and synopsis
      const rawText = `${b.judul} ${b.penulis} ${b.kategori} ${b.sinopsis}`;
      return preprocessText(rawText);
    });

    // Populate the unique vocabulary terms
    const vocabSet = new Set<string>();
    this.corpus.forEach((doc) => doc.forEach((term) => vocabSet.add(term)));
    this.vocabulary = Array.from(vocabSet);

    // Compute IDF for all vocabulary words
    const nDocs = this.books.length;
    this.vocabulary.forEach((term) => {
      let docsWithTerm = 0;
      this.corpus.forEach((doc) => {
        if (doc.includes(term)) docsWithTerm++;
      });
      // Standard smoothed IDF formula
      this.idf[term] = Math.log(1 + (nDocs / (docsWithTerm || 1)));
    });

    // Calculate TF-IDF Vectors for all book documents
    this.documentVectors = this.corpus.map((doc) => this.vectorize(doc));
  }

  private vectorize(terms: string[]): number[] {
    const termCounts: { [key: string]: number } = {};
    terms.forEach((term) => {
      termCounts[term] = (termCounts[term] || 0) + 1;
    });

    return this.vocabulary.map((term) => {
      const tf = termCounts[term] || 0;
      const idf = this.idf[term] || 0;
      return tf * idf;
    });
  }

  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generates ranked book recommendations for a given search query
   */
  public getRecommendations(query: string, limit = 3, threshold = 0.05): RecommendationExtended[] {
    const queryTerms = preprocessText(query);
    if (queryTerms.length === 0) return [];

    const queryVector = this.vectorize(queryTerms);
    const recommendations: RecommendationExtended[] = [];

    this.books.forEach((book, idx) => {
      const sim = this.calculateCosineSimilarity(queryVector, this.documentVectors[idx]);
      if (sim >= threshold) {
        // Identify which stemmed keywords are matching
        const bookDocTerms = this.corpus[idx];
        const matchingStemmedTerms = Array.from(
          new Set(queryTerms.filter((term) => bookDocTerms.includes(term)))
        );

        const matchPercentage = Math.round(sim * 1000) / 10;

        // Formulate Indonesian Explainable Statement
        let explanation = '';
        if (matchingStemmedTerms.length > 0) {
          explanation = `Direkomendasikan dengan kecocokan ${matchPercentage}% berdasarkan kata kunci relevan: '${matchingStemmedTerms.slice(0, 3).join(', ')}'.`;
        } else {
          explanation = `Direkomendasikan berdasarkan relevansi topik dengan kecocokan ${matchPercentage}%.`;
        }

        recommendations.push({
          ...book,
          similarity: sim,
          percentage: matchPercentage,
          explanation: explanation,
          matchingTerms: matchingStemmedTerms,
        });
      }
    });

    // Sort by similarity score descending
    return recommendations
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
}
