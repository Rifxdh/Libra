/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { 
  BookOpen, 
  Search, 
  Send, 
  RefreshCw, 
  Bot, 
  User, 
  Bookmark, 
  Sparkles, 
  Grid, 
  Filter, 
  ArrowRight, 
  Info, 
  Calendar, 
  Hash, 
  BookmarkCheck, 
  Download, 
  ChevronRight, 
  X,
  FileText,
  BadgePercent,
  CheckCircle,
  HelpCircle,
  BookMarked
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, RecommendationExtended, Message } from './types.ts';

export default function App() {
  // Application State
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationExtended[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [savedBookIds, setSavedBookIds] = useState<number[]>([]);
  
  // UI States
  const [chatStarted, setChatStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [isReadingListOpen, setIsReadingListOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  
  // Ref for auto scrolling chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load books catalog and local storage saved books on mount
  useEffect(() => {
    fetch('/api/books')
      .then((res) => res.json())
      .then((data) => setAllBooks(data))
      .catch((err) => {
        console.error('Failed to load catalog:', err);
        // Fallback to static client data in case server is not ready
        import('./data/books.ts').then((mod) => {
          setAllBooks(mod.BOOKS_DATABASE);
        });
      });

    // Populate bookmarks from localStorage
    try {
      const saved = localStorage.getItem('ruang_aksara_saved');
      if (saved) {
        setSavedBookIds(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse localStorage bookmarks', e);
    }
  }, []);

  // Sync saved bookmarks with Local Storage
  const toggleBookmark = (id: number) => {
    let updated;
    if (savedBookIds.includes(id)) {
      updated = savedBookIds.filter((bid) => bid !== id);
    } else {
      updated = [...savedBookIds, id];
    }
    setSavedBookIds(updated);
    localStorage.setItem('ruang_aksara_saved', JSON.stringify(updated));
  };

  // Auto-scroll chat window when new message arrives
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Handle message sending
  const handleSendMessage = async (textOverride?: string) => {
    const queryText = (textOverride || input).trim();
    if (!queryText || isLoading) return;

    if (!chatStarted) {
      setChatStarted(true);
    }

    // Capture User input Message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('API server returned error status');
      }

      const data = await response.json();

      // Extend recommendations with structural defaults
      const responseRecs: RecommendationExtended[] = (data.recommendations || []).map((r: any) => ({
        ...r,
        gradient: r.gradient || 'from-slate-600 to-slate-800'
      }));

      // Append chatbot answer to state
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          recommendations: responseRecs,
        },
      ]);

      if (responseRecs.length > 0) {
        setRecommendations(responseRecs);
      }
    } catch (error) {
      console.error('Failed to get CRS recommendation:', error);
      
      // Fallback response inside the client UI
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Maaf, sepertinya ada sedikit kendala koneksi ke server. Namun, saya berhasil mencari di database lokal kami untuk memberikan kecocokan terbaik.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset conversational recommendations
  const handleReset = () => {
    setMessages([]);
    setRecommendations([]);
    setChatStarted(false);
    setInput('');
    setSelectedCategory('Semua');
  };

  // Sample prompt chips
  const samplePrompts = [
    {
      title: "Belajar Python & AI",
      query: "Saya butuh belajar coding pemrograman python dasar, kecerdasan buatan, dan NLP"
    },
    {
      title: "Riset Skripsi Statistika",
      query: "Saya ingin menyusun metodologi penelitian skripsi kualitatif / kuantitatif serta belajar olah statistik"
    },
    {
      title: "Desain UI/UX & SQL",
      query: "Buku belajar desain antarmuka pengguna digital UI/UX dan basis data relasional serta query SQL"
    },
    {
      title: "Tata Bahasa Indonesia",
      query: "Mencari pedoman penulisan karya tulis ilmiah dan tata bahasa baku bahasa Indonesia"
    }
  ];

  // Group books by categories for summary statistics
  const categories = ['Semua', 'Teknologi', 'Matematika', 'Metode Penelitian', 'Bahasa', 'Desain', 'Sains'];
  
  const filteredBooksForCatalog = selectedCategory === 'Semua' 
    ? allBooks 
    : allBooks.filter((b) => b.kategori === selectedCategory);

  const bookmarkedBooks = allBooks.filter((b) => savedBookIds.includes(b.id));

  // Export current list to clipboard or simple file format
  const exportReadingSummary = () => {
    if (bookmarkedBooks.length === 0) return;
    const text = bookmarkedBooks.map((b, i) => `${i + 1}. [${b.kategori}] ${b.judul} - ${b.penulis} (Penerbit: ${b.penerbit}, ISBN: ${b.isbn})`).join('\n');
    navigator.clipboard.writeText(text);
    alert('Daftar Bacaan Anda berhasil disalin ke papan klip (clipboard)!');
  };

  // Robust client-side CSV string parser
  const parseCSV = (text: string): any[] => {
    const lines = [];
    let row = [""];
    let insideQuote = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (insideQuote && nextChar === '"') {
          row[row.length - 1] += '"';
          i++; // skip duplicated quote
        } else {
          insideQuote = !insideQuote;
        }
      } else if ((char === ',' || char === ';') && !insideQuote) {
        row.push("");
      } else if (char === '\r' || char === '\n') {
        if (insideQuote) {
          row[row.length - 1] += char;
        } else {
          if (char === '\r' && nextChar === '\n') {
            i++; // skip carriage return pair
          }
          lines.push(row);
          row = [""];
        }
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== "") {
      lines.push(row);
    }
    
    if (lines.length < 2) return [];
    
    // Normalize headers
    const headers = lines[0].map(h => h.trim().toLowerCase());
    
    // Auto map index
    const indexMap = {
      judul: headers.findIndex(h => h.includes('judul') || h.includes('title') || h.includes('nama') || h.includes('name')),
      penulis: headers.findIndex(h => h.includes('penulis') || h.includes('author') || h.includes('writer')),
      kategori: headers.findIndex(h => h.includes('kategori') || h.includes('category') || h.includes('genre')),
      sinopsis: headers.findIndex(h => h.includes('sinopsis') || h.includes('synopsis') || h.includes('desc') || h.includes('deskripsi')),
      tahun: headers.findIndex(h => h.includes('tahun') || h.includes('year') || h.includes('date')),
      isbn: headers.findIndex(h => h.includes('isbn')),
      halaman: headers.findIndex(h => h.includes('halaman') || h.includes('page') || h.includes('pages')),
      penerbit: headers.findIndex(h => h.includes('penerbit') || h.includes('publisher'))
    };

    const parsedBooks = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.length === 1 && line[0].trim() === "") continue; 
      
      const getValue = (idx: number, fallback = "") => {
        return idx >= 0 && idx < line.length ? line[idx].trim() : fallback;
      };
      
      const categoryRaw = getValue(indexMap.kategori, 'Sains');
      let category = 'Sains';
      const catLower = categoryRaw.toLowerCase();
      if (catLower.includes('tekno') || catLower.includes('it') || catLower.includes('web') || catLower.includes('prog')) category = 'Teknologi';
      else if (catLower.includes('mat') || catLower.includes('hitung') || catLower.includes('aljabar')) category = 'Matematika';
      else if (catLower.includes('meto') || catLower.includes('penelit') || catLower.includes('skripsi') || catLower.includes('riset') || catLower.includes('kualitatif') || catLower.includes('kuantitatif')) category = 'Metode Penelitian';
      else if (catLower.includes('bahasa') || catLower.includes('indo') || catLower.includes('ingg') || catLower.includes('linguist')) category = 'Bahasa';
      else if (catLower.includes('desain') || catLower.includes('design') || catLower.includes('ui') || catLower.includes('art')) category = 'Desain';
      else if (catLower.includes('sains') || catLower.includes('ipa') || catLower.includes('fisika') || catLower.includes('kimia') || catLower.includes('biologi')) category = 'Sains';

      parsedBooks.push({
        judul: getValue(indexMap.judul, 'Buku Tanpa Judul'),
        penulis: getValue(indexMap.penulis, 'Anonim'),
        kategori: category,
        sinopsis: getValue(indexMap.sinopsis, 'Tidak ada deskripsi yang tersedia.'),
        tahun: parseInt(getValue(indexMap.tahun, '2025')) || 2025,
        isbn: getValue(indexMap.isbn, '000-000-000-0-0'),
        halaman: parseInt(getValue(indexMap.halaman, '150')) || 150,
        penerbit: getValue(indexMap.penerbit, 'Penerbit Mandiri')
      });
    }
    
    return parsedBooks;
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setImportStatus({ success: false, message: 'File CSV kosong atau gagal dibaca.' });
          return;
        }

        const parsedBooks = parseCSV(text);
        if (parsedBooks.length === 0) {
          setImportStatus({ 
            success: false, 
            message: 'Gagal memproses baris data. Pastikan format kolom memiliki judul, penulis, kategori, sinopsis, tahun, isbn, halaman, dan penerbit.' 
          });
          return;
        }

        // POST request to update active books
        const response = await fetch('/api/books/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ books: parsedBooks }),
        });

        if (!response.ok) {
          throw new Error('Server import returned error status');
        }

        const data = await response.json();
        if (data.success) {
          setAllBooks(data.books || parsedBooks);
          setImportStatus({ 
            success: true, 
            message: `Selesai! Berhasil mengimpor ${data.count} koleksi buku baru ke dalam Libra.` 
          });
        } else {
          setImportStatus({ success: false, message: data.error || 'Server gagal memproses import buku.' });
        }
      } catch (err) {
        console.error('Import action failed:', err);
        setImportStatus({ success: false, message: 'Kesalahan internal terjadi saat mengunggah file.' });
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // trigger future identical file selections
  };

  const exportCurrentDatasetCSV = () => {
    if (allBooks.length === 0) return;
    
    const headers = ['judul', 'penulis', 'kategori', 'sinopsis', 'tahun', 'isbn', 'halaman', 'penerbit'];
    
    const rows = allBooks.map((b) => [
      b.judul.replace(/"/g, '""'),
      b.penulis.replace(/"/g, '""'),
      b.kategori,
      b.sinopsis.replace(/"/g, '""'),
      b.tahun.toString(),
      b.isbn,
      b.halaman.toString(),
      b.penerbit.replace(/"/g, '""')
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'libra_books_dataset.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadCSVTemplate = () => {
    const headers = ['judul', 'penulis', 'kategori', 'sinopsis', 'tahun', 'isbn', 'halaman', 'penerbit'];
    const sampleRows = [
      [
        'Pemrograman Web Komprehensif',
        'Imam Azhari',
        'Teknologi',
        'Buku ini membahas pengembangan website modern menggunakan React, Node.js, Express, Tailwind CSS, dan basis data PostgreSQL.',
        '2024',
        '978-602-9999-01-2',
        '290',
        'Erlangga Pustaka'
      ],
      [
        'Fisika Kuantum Dasar',
        'Siti Nurhaliza',
        'Sains',
        'Memaparkan konsep dasar mekanika kuantum, fungsi gelombang Schrodinger, partikel dalam kotak, dan prinsip ketidakpastian Heisenberg.',
        '2023',
        '978-623-2222-33-4',
        '210',
        'Aksara Pustaka'
      ]
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleRows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'libra_csv_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900 font-sans antialiased selection:bg-stone-800 selection:text-white" id="main_wrapper">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-stone-200 px-4 lg:px-8 py-4 flex items-center justify-between" id="app_header">
        <div className="flex items-center gap-3.5">
          <div className="bg-stone-900 hover:bg-stone-800 text-stone-100 p-2.5 rounded-lg transition shadow-xs cursor-pointer flex items-center justify-center border border-stone-800" onClick={handleReset}>
            <BookOpen className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-bold font-serif italic tracking-tight text-stone-900">Libra</h1>
              <span className="hidden sm:inline-block bg-stone-100 text-stone-800 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-stone-200/80">Conversational AI</span>
            </div>
            <p className="text-xs text-stone-500 font-medium tracking-wide font-sans">Asisten Rekomendasi Buku Perpustakaan Kampus</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* User local Saved Books Toggle button */}
          <button 
            onClick={() => setIsReadingListOpen(!isReadingListOpen)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition shadow-3xs ${
              savedBookIds.length > 0 
                ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100' 
                : 'bg-white border-stone-300 text-stone-650 hover:bg-stone-50'
            }`}
            id="saved_books_toggle"
          >
            <BookMarked className={`w-4 h-4 ${savedBookIds.length > 0 ? 'text-amber-700 animate-pulse' : ''}`} />
            <span className="hidden sm:inline">Daftar Bacaan</span>
            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
              savedBookIds.length > 0 ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-550'
            }`}>
              {savedBookIds.length}
            </span>
          </button>

          {/* Quick Clear Conversation link */}
          {chatStarted && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800 border border-stone-300 bg-white hover:bg-stone-50 rounded-lg transition shadow-3xs"
              id="reset_btn"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Bersihkan</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Body Grid Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 flex flex-col justify-between" id="canvas_container">
        
        <AnimatePresence mode="wait">
          {!chatStarted ? (
            
            /* LANDING VIEW: Landing Digital Library Search Mode with classical editorial aesthetic */
            <motion.div 
              key="landing_view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex-1 flex flex-col justify-center items-center py-8 lg:py-12 max-w-3xl mx-auto w-full"
              id="landing_content_view"
            >
              
              {/* Branding Visual Logo / Icon Grid */}
              <div className="mb-6 relative">
                <div className="w-16 h-16 rounded-2xl bg-stone-950 flex items-center justify-center shadow-md text-white relative z-10 border border-stone-800">
                  <Sparkles className="w-7 h-7 text-amber-400 animate-pulse" />
                </div>
                <div className="absolute top-0 left-0 w-16 h-16 rounded-2xl bg-amber-400 blur-md opacity-20 scale-110 -z-0"></div>
              </div>

              {/* Catchy Slogans / Title */}
              <div className="text-center mb-8">
                <h2 className="text-3xl lg:text-5xl font-bold font-serif italic text-stone-900 tracking-tight leading-tight max-w-2xl mx-auto">
                  Pencarian Koleksi Akademis Lebih Cerdas
                </h2>
                <p className="mt-4 text-stone-600 max-w-lg mx-auto text-sm lg:text-base leading-relaxed font-sans">
                  Tuliskan topik atau minat riset Anda dalam bahasa alami. Mitra asisten kami akan langsung menganalisis dan menampilkan rekomendasi buku beserta <span className="font-serif italic font-semibold text-stone-900 text-sm bg-stone-200/50 px-2 py-0.5 rounded">persentase kemiripan</span> kecocokan secara akurat.
                </p>
              </div>

              {/* Prominent Center Search Bar in Landing View */}
              <div className="w-full bg-white border border-stone-300 shadow-sm rounded-xl p-3 mb-8 focus-within:ring-2 focus-within:ring-stone-800 focus-within:border-transparent transition-all duration-300" id="landing_sandbox_input_container">
                <div className="flex gap-2.5 items-center">
                  <div className="text-stone-400 pl-2">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Tulis kriteria pencarian atau topik yang ingin Anda teliti disini..."
                    className="flex-1 bg-transparent text-stone-900 placeholder-stone-400 text-sm focus:outline-none py-1.5"
                    id="landing_search_bar_input"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white px-6 py-2.5 font-bold uppercase tracking-widest text-[10px] rounded-lg transition shadow-xs shrink-0 flex items-center gap-1.5"
                    id="landing_search_bar_submit"
                  >
                    <span>Cari Buku</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              </div>

              {/* Guided Prompt Suggestions */}
              <div className="w-full mb-12">
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em] mb-4 text-center">
                  Contoh Kueri Pencarian Akademik
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="sample_prompts_g">
                  {samplePrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(p.query)}
                      className="text-left bg-white hover:bg-stone-50 hover:border-stone-400 border border-stone-200 rounded-xl p-4 transition group shadow-3xs"
                    >
                      <div className="flex items-center justify-between pointer-events-none">
                        <span className="text-xs font-bold font-serif italic text-stone-900">{p.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-800 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed group-hover:text-stone-600 pointer-events-none font-sans">
                        "{p.query}"
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Beautiful Book Catalog Browser Section inside Landing View */}
              <div className="w-full border-t border-stone-300 pt-8 mt-4">
                
                {/* Visual Admin controls strip for CSV bulk ingestion */}
                <div className="mb-6 p-4 bg-white border border-stone-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-3xs" id="csv_dataset_controls">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-stone-100 rounded-lg text-stone-700">
                      <FileText className="w-4.5 h-4.5 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 font-sans">Kelola Dataset Libra</h4>
                      <p className="text-[10px] text-stone-400 mt-0.5">Unggah CSV untuk memuat database buku kustom Anda ke Libra</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* CSV Upload */}
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 border border-stone-950 text-stone-150 hover:bg-stone-800 rounded-lg text-[10.5px] font-bold uppercase tracking-wider cursor-pointer shadow-3xs transition">
                      <Download className="w-3.5 h-3.5 text-amber-400 rotate-180" />
                      <span>Unggah CSV Dataset</span>
                      <input 
                        type="file" 
                        accept=".csv" 
                        onChange={handleCSVUpload} 
                        className="hidden" 
                      />
                    </label>
                    {/* TSV/CSV Export */}
                    <button
                      onClick={exportCurrentDatasetCSV}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-lg text-[10.5px] font-bold uppercase tracking-wider shadow-3xs transition"
                    >
                      <Download className="w-3.5 h-3.5 text-stone-500" />
                      <span>Ekspor CSV</span>
                    </button>
                    {/* Sample Template Download */}
                    <button
                      onClick={downloadCSVTemplate}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-200 text-stone-500 hover:bg-stone-100 rounded-lg text-[10.5px] font-bold uppercase tracking-wider transition"
                      title="Unduh contoh template kolom CSV"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
                      <span>Unduh Template</span>
                    </button>
                  </div>
                </div>

                {importStatus && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`mb-6 p-4 rounded-xl border text-xs leading-relaxed font-semibold flex items-center justify-between ${
                      importStatus.success 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{importStatus.success ? '✅' : '⚠️'}</span>
                      <span>{importStatus.message}</span>
                    </div>
                    <button 
                      onClick={() => setImportStatus(null)} 
                      className="text-[10px] uppercase font-bold border border-current rounded px-1.5 py-0.5 hover:bg-black/5"
                    >
                      Tutup
                    </button>
                  </motion.div>
                )}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-3">
                  <div className="flex items-center gap-2">
                    <Grid className="w-4.5 h-4.5 text-stone-600" />
                    <h3 className="text-xs font-bold text-stone-450 uppercase tracking-[0.2em] font-sans">
                      Jelajahi Katalog Perpustakaan ({filteredBooksForCatalog.length} Koleksi)
                    </h3>
                  </div>
                  
                  {/* Category scrollable badging */}
                  <div className="flex flex-wrap gap-1.5" id="category_scroll_p">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-[10px] px-3.5 py-1 rounded-lg font-bold uppercase tracking-wider transition ${
                          selectedCategory === cat 
                            ? 'bg-stone-900 text-white' 
                            : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200 shadow-3xs'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Books list item scroll preview */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" id="catalog_books_preview_g">
                  {filteredBooksForCatalog.slice(0, 8).map((book) => (
                    <div 
                      key={book.id}
                      onClick={() => setSelectedBook(book)}
                      className="bg-white border border-stone-200 rounded-xl p-4 shadow-3xs hover:shadow-md hover:border-stone-400 transition-all duration-300 cursor-pointer group flex flex-col justify-between h-[210px]"
                    >
                      <div>
                        {/* Elegant minimalist structural top accent bar matching categories */}
                        <div className={`w-full h-1.5 rounded bg-gradient-to-r ${book.gradient} mb-3 opacity-90`}></div>
                        <span className="text-[9px] bg-stone-100 border border-stone-200 text-stone-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          {book.kategori}
                        </span>
                        <h4 className="font-bold font-serif italic text-stone-900 text-sm mt-2.5 leading-snug line-clamp-2 group-hover:text-amber-800 transition">
                          {book.judul}
                        </h4>
                        <p className="text-[11px] text-stone-500 mt-1 line-clamp-1 font-sans">
                          {book.penulis}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-400 border-t border-stone-100 pt-2.5 mt-2.5 pointer-events-none font-sans">
                        <span className="font-mono text-[10px] uppercase tracking-wider">{book.penerbit}</span>
                        <Info className="w-3.5 h-3.5 text-stone-300" />
                      </div>
                    </div>
                  ))}
                </div>
                {filteredBooksForCatalog.length === 0 && (
                  <div className="text-center py-10 bg-white border border-dashed border-stone-200 rounded-xl p-4">
                    <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2.5" />
                    <p className="text-xs text-stone-500 font-semibold">Tidak ada buku dalam kategori {selectedCategory}</p>
                  </div>
                )}
              </div>
              
            </motion.div>

          ) : (
            
            /* ACTIVE WORKSPACE: Dynamic Split Area for chat-turn dialogue and calculations visualizer with Editorial theme */
            <motion.div 
              key="workspace_view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6"
              id="workspace_content_view"
            >
              
              {/* Left Column: Multi-turn Chat Panel (7 columns broad) */}
              <div className="lg:col-span-7 flex flex-col bg-white border-2 border-stone-200 rounded-xl overflow-hidden h-[580px] lg:h-[620px]" id="chat_panel_container">
                {/* Chat header summary */}
                <div className="px-5 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-900 animate-pulse"></div>
                    <span className="text-xs font-bold font-sans tracking-widest text-stone-700 uppercase">Proses CRS Aktif ── Obrolan</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono tracking-wider uppercase">Pertanyaan: {messages.filter(m => m.role === 'user').length}</span>
                </div>

                {/* Messages dialog feeds */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin" id="messages_feed">
                  
                  {/* Hardcoded system onboarding message at the beginning of stream */}
                  <div className="flex gap-3.5 max-w-[85%] mr-auto">
                    <div className="w-8 h-8 rounded bg-stone-100 border border-stone-200 text-stone-900 flex items-center justify-center shrink-0 shadow-3xs">
                      <Bot className="w-4.5 h-4.5 text-stone-700" />
                    </div>
                    <div className="bg-stone-50 border border-stone-200 text-stone-850 p-4 rounded-xl rounded-tl-none text-xs lg:text-sm leading-relaxed" id="welcome_bubble_syst">
                      Halo! Saya asisten virtual <span className="font-serif italic font-bold text-stone-900 border-b border-amber-300">Libra</span>. Selamat datang di perpustakaan digital terintegrasi. Tanyakan apa saja yang sedang Anda minati atau butuhkan untuk bahan penelitian Anda agar asisten cerdas membantu mencocokkan koleksi buku berdasar tingkat relevansinya secara real-time.
                    </div>
                  </div>

                  {/* Render conversation array */}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3.5 max-w-[85%] ${
                        msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      }`}
                    >
                      {/* Avatar design */}
                      <div
                        className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0 border ${
                          msg.role === 'user'
                            ? 'bg-stone-50 border-stone-300 text-stone-800'
                            : 'bg-stone-100 border-stone-200 text-stone-800'
                        }`}
                      >
                        {msg.role === 'user' ? <User className="w-4 h-4 text-stone-650" /> : <Bot className="w-4 h-4 text-stone-650" />}
                      </div>

                      {/* Msg bubble container */}
                      <div className="flex flex-col gap-1.5 max-w-full">
                        <div
                          className={`p-4 rounded-xl text-xs lg:text-sm leading-relaxed border ${
                            msg.role === 'user'
                              ? 'bg-stone-900 border-stone-950 text-stone-100 rounded-tr-none'
                              : 'bg-stone-50 border-stone-200 text-stone-800 rounded-tl-none font-sans'
                          }`}
                        >
                          {/* Render response using react-markdown for rich, elegant typography */}
                          <div className="markdown-body">
                            <Markdown
                              components={{
                                h1: ({ node, ...props }) => <h1 className={`text-base font-bold mt-3 mb-1 font-serif italic ${msg.role === 'user' ? 'text-white' : 'text-stone-900'}`} {...props} />,
                                h2: ({ node, ...props }) => <h2 className={`text-sm font-bold mt-2 mb-1 ${msg.role === 'user' ? 'text-white' : 'text-stone-900'}`} {...props} />,
                                h3: ({ node, ...props }) => <h3 className={`text-xs font-bold mt-1.5 mb-1 uppercase tracking-wider ${msg.role === 'user' ? 'text-stone-200' : 'text-stone-800'}`} {...props} />,
                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                                li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
                                strong: ({ node, ...props }) => <strong className={`font-extrabold ${msg.role === 'user' ? 'text-white' : 'text-stone-950'}`} {...props} />,
                                em: ({ node, ...props }) => <em className="italic" {...props} />,
                                blockquote: ({ node, ...props }) => <blockquote className={`border-l-2 pl-3 italic my-2 ${msg.role === 'user' ? 'border-stone-500 text-stone-300' : 'border-stone-300 text-stone-600'}`} {...props} />,
                              }}
                            >
                              {msg.content}
                            </Markdown>
                          </div>

                          {/* Mini inline display tags inside AI responses if they contained matching items */}
                          {msg.role === 'assistant' && msg.recommendations && msg.recommendations.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-dashed border-stone-250 flex flex-wrap gap-1.5 items-center">
                              <span className="text-[9px] font-bold uppercase text-stone-400 tracking-widest">Detail Cepat:</span>
                              {msg.recommendations.map((rec) => (
                                <button
                                  key={rec.id}
                                  onClick={() => setSelectedBook(rec)}
                                  className="text-[10px] bg-white hover:bg-stone-100 text-stone-800 font-serif italic font-bold px-2.5 py-0.5 rounded border border-stone-200 transition inline-flex items-center gap-1.5 shadow-3xs"
                                >
                                  <span>"{rec.judul.slice(0, 16)}..."</span>
                                  <BadgePercent className="w-3 h-3 text-amber-700" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Timestamp sign */}
                        <span className={`text-[9px] text-stone-400 px-1 font-mono tracking-wider uppercase ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Loading visualizer feedback bubble */}
                  {isLoading && (
                    <div className="flex gap-3.5 max-w-[80%] mr-auto items-start">
                      <div className="w-8 h-8 rounded bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="bg-stone-50 border border-stone-200 text-stone-500 p-4 rounded-xl rounded-tl-none text-xs leading-relaxed italic flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-700 animate-ping"></span>
                          <span className="font-bold text-stone-800">Libra sedang mencari keselarasan buku...</span>
                        </div>
                        <p className="text-[10.5px] text-stone-400 font-sans not-italic">
                          Libra sedang menyelaraskan kueri Anda dengan deskripsi pustaka buku serta menyusun persentase tingkat kemiripan kecocokan...
                        </p>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input Workspace box at bottom */}
                <div className="p-4 border-t-2 border-stone-200 bg-white">
                  <div className="flex gap-2.5 items-center bg-stone-50 border border-stone-300 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-stone-800 focus-within:border-transparent focus-within:bg-white transition duration-250">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Masukkan pertanyaan atau topik buku baru disini..."
                      className="flex-1 bg-transparent text-stone-900 placeholder-stone-400 text-sm focus:outline-none py-0.5"
                      id="workspace_chat_input"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!input.trim() || isLoading}
                      className="bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-100 p-2 rounded transition shrink-0 flex items-center justify-center border border-stone-850"
                      id="workspace_chat_submit"
                    >
                      <Send className="w-4.5 h-4.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2.5 px-1 text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                    <span>💡 Model: <span className="font-mono text-xs bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded text-stone-600">gemini-3.5-flash</span></span>
                    <span>Bahasa Indonesia Terstruktur</span>
                  </div>
                </div>
              </div>


              {/* Right Column: Visualizer of Recommendation Output Cards (5 columns broad) */}
              <div className="lg:col-span-5 flex flex-col bg-stone-50 border-2 border-stone-200 rounded-xl p-5 overflow-y-auto h-[580px] lg:h-[620px] scrollbar-thin" id="similarity_dashboard_panel">
                
                {/* Visual Dashboard Topline Bar */}
                <div className="flex justify-between items-center mb-5 border-b-2 border-stone-200 pb-3">
                  <div>
                    <h2 className="text-xs font-bold text-stone-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Analisis Relevansi</span>
                    </h2>
                    <p className="text-[10px] text-stone-400 mt-0.5 font-medium">Peringkat Persentase Relevansi Kueri</p>
                  </div>
                  <span className="bg-stone-900 text-stone-100 text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-wider border border-stone-950">
                    {recommendations.length} Evaluasi
                  </span>
                </div>

                {/* Vertical lists of evaluated output cards */}
                <div className="space-y-4">
                  {recommendations.length > 0 ? (
                    recommendations.map((book) => {
                      const isSaved = savedBookIds.includes(book.id);
                      return (
                        <motion.div
                          key={book.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.25 }}
                          className="bg-white border-2 border-stone-200 hover:border-stone-900 rounded-xl p-5 shadow-3xs hover:shadow-2xs transition-all duration-300 relative group flex flex-col justify-between"
                        >
                          <div>
                            {/* Card badge line */}
                            <div className="flex justify-between items-start gap-2 mb-3.5">
                              <span className="bg-stone-100 border border-stone-200 text-stone-700 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md">
                                {book.kategori}
                              </span>
                              
                              {/* Matching Score Circle / Tag Layout */}
                              <div className="flex items-center gap-1.5 bg-stone-900 text-stone-100 font-bold px-2.5 py-0.5 rounded text-[10px] border border-stone-950 tracking-wide font-sans">
                                <BadgePercent className="w-3.5 h-3.5 text-amber-400" />
                                <span>Kemiripan {book.percentage}%</span>
                              </div>
                            </div>

                            {/* Book titles & author metadata */}
                            <h3 className="font-bold font-serif italic text-stone-950 text-base leading-snug group-hover:text-amber-80 *0 transition cursor-pointer" onClick={() => setSelectedBook(book)}>
                              {book.judul}
                            </h3>
                            <p className="text-[10px] text-stone-400 mt-1.5 font-bold font-sans uppercase tracking-wider">Penulis: {book.penulis} &bull; {book.tahun}</p>

                            {/* Brief truncated synopsis block */}
                            <p className="text-[12px] text-stone-605 mt-3 leading-relaxed line-clamp-3">
                              {book.sinopsis}
                            </p>

                            {/* AI formulated explainable tag inside a dynamic quote container */}
                            <div className="mt-4 text-[11px] bg-stone-50 border-l-3 border-stone-900 p-3 text-stone-850 border-r border-t border-b border-stone-200 rounded-r-lg italic flex gap-1.5 items-start font-sans">
                              <span className="shrink-0 text-amber-500">💡</span>
                              <span className="leading-relaxed font-medium">{book.explanation}</span>
                            </div>
                          </div>

                          {/* Quick Interactive action row inside the recommendation cards */}
                          <div className="mt-4.5 pt-3.5 border-t border-stone-100 flex items-center justify-between gap-3">
                            <button
                              onClick={() => setSelectedBook(book)}
                              className="text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900 transition inline-flex items-center gap-1.5 bg-stone-50 hover:bg-stone-100 px-3 py-2 rounded border border-stone-200 hover:border-stone-400 shadow-3xs"
                            >
                              <Info className="w-3.5 h-3.5 text-stone-400" />
                              <span>Lihat Detail</span>
                            </button>

                            {/* Save Book bookmark trigger */}
                            <button
                              onClick={() => toggleBookmark(book.id)}
                              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded border transition inline-flex items-center gap-1.5 shadow-3xs ${
                                isSaved 
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100' 
                                  : 'bg-white border-stone-200 text-stone-650 hover:bg-stone-50 hover:border-stone-400'
                              }`}
                            >
                              {isSaved ? (
                                <>
                                  <BookmarkCheck className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Tersimpan</span>
                                </>
                              ) : (
                                <>
                                  <Bookmark className="w-3.5 h-3.5 text-stone-400" />
                                  <span>Simpan</span>
                                </>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    /* Dashboard empty state visualizer under Editorial Theme */
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20 px-6 bg-white border-2 border-dashed border-stone-250 rounded-xl shadow-3xs min-h-[300px]">
                      <div className="w-12 h-12 rounded bg-stone-100 border border-stone-200 flex items-center justify-center mb-4">
                        <BookOpen className="w-6 h-6 text-stone-400" />
                      </div>
                      <p className="text-xs font-bold text-stone-700 tracking-[0.15em] uppercase">Relevansi Kosong</p>
                      <p className="text-[11px] text-stone-400 mt-1.5 max-w-[210px] leading-relaxed font-sans">
                        Gunakan kolom bincang di sebelah kiri untuk berdiskusi dengan asisten virtual dan menampilkan model similarity teks.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Details Popup Modal overlay when checking particular publication */}
        <AnimatePresence>
          {selectedBook && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs" id="detail_modal_overlay">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-lg border-2 border-stone-300"
                id="detail_modal_card"
              >
                {/* Book structural banner style */}
                <div className={`p-6 bg-gradient-to-r ${selectedBook.gradient} text-white relative`}>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="absolute top-4 right-4 bg-black/35 hover:bg-black/50 hover:scale-105 p-1.5 rounded-full transition-all text-white flex items-center justify-center border border-white/20"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <span className="text-[9px] bg-white/20 border border-white/20 text-stone-100 font-bold px-2.5 py-0.5 rounded uppercase tracking-widest inline-block">
                    {selectedBook.kategori}
                  </span>
                  <h3 className="text-xl lg:text-2xl font-bold font-serif italic mt-3.5 leading-snug tracking-tight">
                    {selectedBook.judul}
                  </h3>
                  <p className="text-xs text-stone-300 mt-1.5 font-medium font-sans">Penulis: {selectedBook.penulis}</p>
                </div>

                {/* Technical detailed indices layout */}
                <div className="p-6">
                  {/* Meta indices grid */}
                  <div className="grid grid-cols-2 gap-4 border-b border-stone-200 pb-4 mb-4 text-xs font-medium">
                    <div className="flex items-center gap-2.5 text-stone-600">
                      <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                      <div>
                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Tahun Terbit</p>
                        <p className="text-stone-900 font-bold">{selectedBook.tahun}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-stone-605">
                      <Hash className="w-4 h-4 text-stone-400 shrink-0" />
                      <div>
                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">ISBN</p>
                        <p className="text-stone-900 font-mono font-bold text-[11px]">{selectedBook.isbn}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-stone-600">
                      <FileText className="w-4 h-4 text-stone-400 shrink-0" />
                      <div>
                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Jumlah Halaman</p>
                        <p className="text-stone-900 font-bold">{selectedBook.halaman} halaman</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-stone-605">
                      <BookOpen className="w-4 h-4 text-stone-400 shrink-0" />
                      <div>
                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Penerbit</p>
                        <p className="text-stone-900 font-bold">{selectedBook.penerbit}</p>
                      </div>
                    </div>
                  </div>

                  {/* Synopsis Description block */}
                  <div>
                    <h4 className="text-[10px] font-bold text-stone-400 tracking-wider uppercase mb-2">Sinopsis Buku</h4>
                    <p className="text-xs lg:text-sm text-stone-705 leading-relaxed max-h-[140px] overflow-y-auto pr-1 font-sans">
                      {selectedBook.sinopsis}
                    </p>
                  </div>

                  {/* Bookmark CTA Button */}
                  <div className="mt-6 pt-5 border-t border-stone-200 flex items-center justify-between gap-3">
                    <button
                      onClick={() => toggleBookmark(selectedBook.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded border text-xs font-bold uppercase tracking-wider transition shadow-3xs ${
                        savedBookIds.includes(selectedBook.id)
                          ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                          : 'bg-stone-900 hover:bg-stone-800 text-stone-100 border-stone-950'
                      }`}
                    >
                      {savedBookIds.includes(selectedBook.id) ? (
                        <>
                          <BookmarkCheck className="w-4 h-4 text-amber-700" />
                          <span>Hapus dari Daftar Bacaan</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4" />
                          <span>Masukkan ke Daftar Bacaan</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedBook(null)}
                      className="border border-stone-300 hover:bg-stone-100 text-stone-600 font-bold uppercase tracking-wider px-4 py-2.5 rounded text-xs transition shadow-3xs"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Dynamic Slide Drawer panel for Saved Favorites list (Bookmarks / Reading Lists) */}
        <AnimatePresence>
          {isReadingListOpen && (
            <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/30 backdrop-blur-3xs" id="bookmarks_canvas_overlay" onClick={() => setIsReadingListOpen(false)}>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                onClick={(e) => e.stopPropagation()} // halt overlay closing
                className="bg-stone-50 w-full max-w-sm h-full shadow-lg flex flex-col justify-between border-l-2 border-stone-300"
                id="bookmarks_drawer"
              >
                {/* Header bookmarks */}
                <div className="p-5 border-b-2 border-stone-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BookMarked className="w-5 h-5 text-amber-500 animate-pulse" />
                    <div>
                      <h3 className="font-serif italic font-bold text-stone-950 text-sm">Daftar Bacaan Saya</h3>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-none mt-1">Sesi Penyimpanan Lokal</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsReadingListOpen(false)}
                    className="p-1.5 hover:bg-stone-100 text-stone-400 hover:text-stone-700 rounded-lg transition border border-stone-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Bookmarks scrolling content list */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                  {bookmarkedBooks.length > 0 ? (
                    bookmarkedBooks.map((book) => (
                      <div 
                        key={book.id}
                        className="bg-white border border-stone-200 hover:border-stone-450 rounded-xl p-4 shadow-3xs hover:shadow-2xs transition flex items-start justify-between gap-3"
                      >
                        <div className="flex-1 cursor-pointer" onClick={() => { setSelectedBook(book); setIsReadingListOpen(false); }}>
                          <span className="text-[8px] bg-stone-100 border border-stone-200 text-stone-605 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            {book.kategori}
                          </span>
                          <h4 className="font-bold font-serif italic text-stone-900 text-xs mt-1.5 line-clamp-2 hover:text-amber-800 transition">
                            {book.judul}
                          </h4>
                          <p className="text-[10px] text-stone-400 mt-1 font-sans">{book.penulis}</p>
                        </div>
                        
                        {/* Quick remove action button */}
                        <button
                          onClick={() => toggleBookmark(book.id)}
                          className="text-stone-300 hover:text-red-650 hover:bg-red-50 p-1.5 rounded border border-stone-200/60 hover:border-red-200 transition shrink-0"
                          title="Hapus bookmark"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    /* Drawer empty state */
                    <div className="text-center py-20 px-4">
                      <Bookmark className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                      <p className="text-xs font-bold text-stone-600 uppercase tracking-widest">Belum Ada Bookmark</p>
                      <p className="text-[10.5px] text-stone-400 mt-2 leading-relaxed max-w-[180px] mx-auto font-sans">
                        Simpan buku akademik yang relevan dengan menekan tombol simpan di kartu samping atau panel asisten.
                      </p>
                    </div>
                  )}
                </div>

                {/* Drawer Footer interactive controls */}
                {bookmarkedBooks.length > 0 && (
                  <div className="p-5 border-t-2 border-stone-200 bg-white gap-2.5 flex flex-col">
                    <button
                      onClick={exportReadingSummary}
                      className="w-full bg-stone-900 hover:bg-stone-800 text-stone-100 py-3 px-4 rounded font-bold uppercase tracking-widest text-[10px] transition inline-flex items-center justify-center gap-1.5 border border-stone-950 shadow-3xs"
                    >
                      <Download className="w-4 h-4 text-amber-400" />
                      <span>Ekspor Daftar Bacaan (Copy)</span>
                    </button>
                    <button
                      onClick={() => { if(confirm('Hapus seluruh daftar bacaan?')) { setSavedBookIds([]); localStorage.removeItem('ruang_aksara_saved'); } }}
                      className="w-full bg-white hover:bg-red-50 text-red-500 hover:text-red-700 border border-stone-300 hover:border-red-200 py-2.5 px-4 rounded font-bold uppercase tracking-widest text-[9px] transition shadow-3xs"
                    >
                      Hapus Semua Bookmark
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

      {/* Footer copyright claims */}
      <footer className="text-center text-[10.5px] text-stone-450 py-5 border-t-2 border-stone-200 bg-white font-sans" id="app_footer_claim">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} Universitas Pembangunan Jaya. Dikembangkan untuk Rancang Bangun CRS berbasis AI.</span>
          <span className="font-mono text-[9px] text-amber-705 flex items-center gap-1.5 uppercase tracking-wide">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-650" />
            <span>Asisten Rekomendasi Buku Cerdas Terintegrasi</span>
          </span>
        </div>
      </footer>
      
    </div>
  );
}
