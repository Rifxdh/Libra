/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Book } from '../types.js';

// Seed lists to generate highly realistic academic, research, and popular science books
const AUTHORS_POOL = [
  "Prof. Dr. Ir. Budi Santoso", "Dr. Eng. Ahmad Syarif", "Prof. Sri Utami M.Si.", "Rian Hidayat S.Kom.",
  "Dr. Maria Elizabeth", "Prof. Alan Turing", "Ir. Megawati Wijaya", "Dr. Jessica Henderson",
  "Prof. John Nash", "Dr. Richard Feynman", "Sarah Jenkins Ph.D.", "Dr. Michael O'Connor",
  "Prof. Donald Knuth", "Grace Hopper M.Sc.", "Dr. Elizabeth Vance", "Prof. Stephen Hawking",
  "Dr. Robert Oppenheimer", "Ada Lovelace", "Dr. Alan Kay", "Prof. Claude Shannon",
  "Dr. Thomas H. Cormen", "Prof. John W. Creswell", "Dr. Judith Bell", "Prof. Don Norman",
  "Dr. Jakob Nielsen", "Rachel Andrews B.Sc.", "Dr. Timothy Berners-Lee", "Prof. Mary L. Boas",
  "Dr. Noam Chomsky", "Walter Isaacson", "Mitch Albom", "Dan Brown", "Alice Sebold", "Ray Bradbury",
  "Feri Sulianta", "Eko Prasetyo", "Bambang Hariyanto", "Rinaldi Munir", "Jogianto Hartono",
  "Suharsimi Arikunto", "Sugiyono M.Pd.", "Lexy J. Moleong", "Burhan Bungin", "Andi Pramono"
];

const PUBLISHERS_POOL = [
  "UPJ Press", "Erlangga Academic", "Andi Offset", "Aksara Pustaka Utama", "Penerbit informatika",
  "Salemba Teknika", "Gramedia Pustaka Utama", "MIT Press", "O'Reilly Media", "Springer-Verlag",
  "Cambridge University Press", "Oxford Academic", "Wiley & Sons", "SAGE Publications",
  "Pearson Education", "Addison-Wesley", "Prentice Hall", "Basic Books", "HarperCollins"
];

const GRADIENTS_POOL = [
  "from-blue-600 to-indigo-750",
  "from-purple-600 to-indigo-750",
  "from-emerald-600 to-teal-750",
  "from-amber-600 to-orange-750",
  "from-red-600 to-rose-750",
  "from-sky-600 to-indigo-750",
  "from-teal-600 to-emerald-750",
  "from-violet-600 to-fuchsia-750",
  "from-rose-600 to-pink-750"
];

// Helper to get random element
function randOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to generate consistent ISBN
function generateISBN(idx: number): string {
  const code1 = 978;
  const code2 = 602;
  const code3 = Math.floor(1000 + (idx * 7) % 8999);
  const code4 = Math.floor(10 + (idx * 3) % 89);
  const code5 = idx % 10;
  return `${code1}-${code2}-${code3}-${code4}-${code5}`;
}

export function generateLibraryDataset(): Book[] {
  const books: Book[] = [];
  let currentId = 1;

  // Categories map
  const categories = [
    {
      name: "Teknologi",
      themes: [
        {
          titles: ["Aplikasi Web Modern", "Arsitektur Microservices", "Sistem Database Terdistribusi", "Kecerdasan Buatan Baru", "Dasar Jaringan Komputer", "Manajemen Proyek Perangkat Lunak", "Pengantar Cloud Computing", "Cybersecurity & Proteksi Data", "Pemrograman Berorientasi Objek", "Struktur Data Kompleks"],
          synopsis_parts: {
            opening: "Buku panduan teknis mendalam tentang pengembangan perangkat lunak dan infrastruktur modern digital.",
            core: "Menjelaskan implementasi RESTful API, integrasi basis data SQL maupun NoSQL, arsitektur framework berkinerja tinggi, pengujian unit otomatis, serta keamanan transmisi enkripsi data.",
            closing: "Sangat direkomendasikan bagi mahasiswa program studi informatika, praktisi IT, serta perekayasa sistem."
          }
        },
        {
          titles: ["Algoritma Pencarian Efektif", "Implementasi Mobile Apps", "Pengenalan Internet of Things (IoT)", "Sistem Operasi Lanjut", "Dunia Machine Learning Praktis", "Pemrograman Web dengan React", "Analisis Sistem Informasi", "Dasar Kriptografi Modern"],
          synopsis_parts: {
            opening: "Menyelami inti dari penulisan kode terstruktur, arsitektur bersih, serta optimasi efisiensi berjalan.",
            core: "Membahas konsep pemrosesan paralel, komputasi asinkron, manajemen memori tingkat rendah, visualisasi data, pengolahan API server-side, serta implementasi kecerdasan buatan.",
            closing: "Menjadi referensi akademis utama yang memuat studi kasus industri nyata dan latihan praktikum."
          }
        }
      ]
    },
    {
      name: "Matematika",
      themes: [
        {
          titles: ["Kalkulus Diferensial Terapan", "Aljabar Linear Numerik", "Teori Probabilitas & Statistika", "Matematika Diskrit Komprehensif", "Pengenalan Analisis Kompleks", "Metode Optimasi Stokastik", "Pemodelan Matematika Sains", "Pengantar Topologi Dasar"],
          synopsis_parts: {
            opening: "Sebuah tinjauan analitis terperinci mengenai formula matematika dan pembuktian teorema formal ilmiah.",
            core: "Mengupas transformasi matriks multi-dimensi, kalkulus kuantitatif integral, model spasial geometri linier, pemrosesan deret numerik komputer, serta analisis limit fungsi.",
            closing: "Sangat penting sebagai penunjang mata kuliah inti sains komputer, statistika terapan, dan metodologi kuantitatif."
          }
        },
        {
          titles: ["Analisis Deret Fourier", "Persamaan Diferensial Lanjut", "Prinsip Teori Permainan (Game Theory)", "Statistika Non-Parametrik Terapan", "Matematika Keuangan Praktis", "Logika Matematika Modern", "Fungsi Variabel Kompleks"],
          synopsis_parts: {
            opening: "Menguraikan cara kerja penalaran matematis dalam menyelesaikan tantangan nyata di bidang rekayasa dan riset ilmiah.",
            core: "Menjelaskan konsep distribusi peluang peubah acak, estimasi interval parameter, pengujian hipotesis, aljabar boolean sirkuit logika, serta pemodelan simulasi Monte Carlo.",
            closing: "Membantu menumbuhkan logika pemecahan masalah secara terstruktur bagi akademisi dan praktisi."
          }
        }
      ]
    },
    {
      name: "Metode Penelitian",
      themes: [
        {
          titles: ["Panduan Lengkap Metodologi Penelitian", "Desain Penelitian Kualitatif Efektif", "Penerapan Metode Campuran (Mixed Methods)", "Teknik Pengolahan Data Empiris", "Panduan Sukses Menulis Skripsi", "Etika Penelitian & Plagiarisme", "Studi Kasus Ilmu Sosial"],
          synopsis_parts: {
            opening: "Buku pegangan wajib bagi para peneliti pemula dan mahasiswa tingkat akhir dalam merancang proyek ilmiah.",
            core: "Membahas secara bertahap teknik perumusan masalah, tinjauan pustaka sistematis, penarikan sampel acak terstruktur, perancangan kuesioner valid, wawancara mendalam, serta transkripsi konten kualitatif.",
            closing: "Dilengkapi dengan panduan praktis menghindari plagiarisme serta taktik sukses publikasi jurnal bereputasi."
          }
        },
        {
          titles: ["Analisis Statistik Kuantitatif", "Metode Survei Sosial Terapan", "Praktik Software SPSS & R", "Desain Eksperimen Laboratorium", "Metode Pengumpulan Data Primer", "Panduan Penulisan Proposal Riset", "Metodologi Grounded Theory"],
          synopsis_parts: {
            opening: "Menjelaskan metode sistematis dalam membingkai hipotesis penelitian menjadi hasil temuan representatif.",
            core: "Menguji keandalan instrumen dengan uji validitas dan reliabilitas, pemetaan regresi berganda, korelasi variabel laten, triangulasi data kualitatif kuantitatif, serta penarikan kesimpulan induktif.",
            closing: "Sangat direkomendasikan untuk bimbingan penyusunan karya tulis akhir diploma, sarjana, maupun riset doktoral profesional."
          }
        }
      ]
    },
    {
      name: "Bahasa",
      themes: [
        {
          titles: ["Pengantar Linguistik Umum", "Tata Bahasa Praktis Lengkap", "Karya Sastra Narasi Reflektif", "Sosiolinguistik & Budaya Tutur", "Semiotika & Analisis Wacana", "Kemahiran Menulis Akademis Inggris", "Sastra Kreatif Novel Indonesia", "Teori Penerjemahan Bahasa"],
          synopsis_parts: {
            opening: "Mengupas evolusi struktur komunikasi manusia secara tertulis, lisan, maupun bahasa simbolik sosial.",
            core: "Mempelajari sintaksis kalimat efektif, morfologi pembentukan kata, fonologi pengucapan vokal, pragmatik konteks percakapan, kritik sastra terhadap prosa, serta hermeneutika teks klasik.",
            closing: "Sangat relevan untuk mempertajam kompetensi komunikasi verbal interpersonal dan meningkatkan keterampilan kepenulisan persuasif."
          }
        },
        {
          titles: ["Retorika & Komunikasi Publik", "Sejarah Pengantar Sastra Dunia", "Keterampilan Membaca Kritis Akademik", "Linguistik Komputasi Modern", "Analisis Semantik Bahasa", "Panduan Menulis Opini Kajian", "Karakteristik Komunikasi Lintas Budaya"],
          synopsis_parts: {
            opening: "Buku literatur komprehensif yang mendedah interpretasi teks estetis serta cara menyusun argumentasi retoris yang mapan.",
            core: "Menjelaskan penyesuaian gaya penulisan kohesif-koheren, dinamika sosiolinguistik perkotaan, analisis dialek lokal, dekonstruksi pascamodernisme sastra, hingga teknik presentasi persuasif.",
            closing: "Menjadi bacaan referensi esensial bagi peminat kajian budaya, sastra, jurnalistik, dan komunikasi massa."
          }
        }
      ]
    },
    {
      name: "Desain",
      themes: [
        {
          titles: ["Prinsip Ergonomi Desain Produk", "Dasar Desain Grafis Visual", "Teori Warna & Tipografi", "Perancangan UI/UX Aplikasi", "Arsitektur Estetika Ruang", "Metode Berpikir Kreatif (Design Thinking)", "Desain Portofolio Digital", "Sejarah Perkembangan Seni Rupa"],
          synopsis_parts: {
            opening: "Sebuah eksplorasi seni rupa terapan yang mengulas esensi estetika fungsional dan kenyamanan interaksi pengguna.",
            core: "Menguraikan harmoni visual tata letak (grid system), kontras gelap terang, keterbacaan jenis huruf san-serif, pemetaan kawat (wireframe) halaman web, konsep kegunaan (usability), dan prototipe produk.",
            closing: "Sangat krusial untuk mahasiswa bidang komunikasi visual, arsitektur, rekayasa interaksi manusia komputer, serta desainer digital."
          }
        },
        {
          titles: ["Strategi Branding Identitas Korporat", "Desain Kemasan Kreatif", "Psikologi Kognitif Desainer", "Desain Interaksi Aplikasi Mobile", "Prinsip Dasar Motion Graphic", "Teknik Ilustrasi Vektor Lanjut", "Metodologi Evaluasi Usability Testing"],
          synopsis_parts: {
            opening: "Memuat strategi komprehensif dalam menerjemahkan pesan nilai abstrak menjadi karya visual ikonik yang memikat audiens.",
            core: "Menjelaskan konsep pemetaan emosi pengguna (user journey mapping), pengujian heuristik antarmuka aplikasi, penyusunan pedoman gaya (style guide/design system), hingga estetika komposisi kemasan produk komersial.",
            closing: "Referensi utama yang membekali pembaca dengan taktik praktis dan teori mutakhir di kancah industri kreatif dunia kelas dunia."
          }
        }
      ]
    },
    {
      name: "Sains",
      themes: [
        {
          titles: ["Dasar Pengantar Fisika Modern", "Mekanika Kuantum & Relativitas", "Biologi Seluler & Genetika", "Kimia Organik Reaksi Terapan", "Kosmologi & Astrofisika", "Prinsip Dasar Ekologi Global", "Mikrobiologi Terapan & Virus", "Ilmu Geologi Fisik Bumi"],
          synopsis_parts: {
            opening: "Sebuah investigasi komparatif empiris tentang rahasia alam semesta dari skala sub-atomik hingga tata surya.",
            core: "Mengulas hukum gerak partikel gelombang, sintesis asam amino molekuler sel, dinamika termodinamika energi terbarukan, ekosistem kelautan bioma darat, serta pembentukan struktur kristal kimiawi.",
            closing: "Ditulis dengan gaya bahasa ilmiah yang lugas dan sangat mudah dipahami, menjadi referensi rujukan silabus sekolah tinggi dunia."
          }
        },
        {
          titles: ["Sains Komputasi Lanjut", "Teori Evolusi & Keanekaragaman", "Kimia Analitik Eksperimental", "Sains Atmosfer & Iklim Global", "Pengantar Bioinformatika Genom", "Mekanika Termodinamika Terapan", "Fisika Kebumian & Seismologi"],
          synopsis_parts: {
            opening: "Mempelajari tatanan hukum-hukum alam yang mengatur fenomena makroskopis dan interaksi biokimia.",
            core: "Menjelaskan perubahan struktural molekul, geofisika seismik patahan bumi, fluktuasi iklim berkepanjangan, pemosisian gravitasi planet bintang, serta teknik laboratorium uji kimiawi presisi.",
            closing: "Sangat direkomendasikan bagi pengajar sains, mahasiswa sains murni, aktivis lingkungan hidup, dan ilmuwan riset."
          }
        }
      ]
    }
  ];

  // Base list to ensure we always have the favorite core books
  const coreBooks = [
    {
      judul: "The Lovely Bones",
      penulis: "Alice Sebold",
      kategori: "Bahasa",
      sinopsis: "Karya fiksi legendaris dari dataset Book-Crossing. Novel naratif emosional yang menceritakan tentang kenangan, hubungan keluarga tegar, analisis karakter psikologis mendalam, serta pemulihan dari tragedi kemanusiaan melalui kekuatan bahasa sastra.",
      tahun: 2002,
      isbn: "0316666343",
      halaman: 328,
      penerbit: "Little, Brown"
    },
    {
      judul: "The Da Vinci Code",
      penulis: "Dan Brown",
      kategori: "Teknologi",
      sinopsis: "Buku fiksi ilmiah terpopuler di Book-Crossing. Menggabungkan unsur kriptografi, kode rahasia, simbol sejarah kuno, pemecahan teka-teki logika tingkat tinggi, matematika golden ratio, serta teori konspirasi dengan alur cerita yang sangat cepat.",
      tahun: 2003,
      isbn: "0385504209",
      halaman: 454,
      penerbit: "Doubleday"
    },
    {
      judul: "A Beautiful Mind",
      penulis: "Sylvia Nasar",
      kategori: "Matematika",
      sinopsis: "Biografi mendalam tentang John Nash, sang jenius matematika pemenang Hadiah Nobel. Mengurai kontribusi pentingnya dalam teori permainan (Game Theory), persamaan diferensial parsial, geometri aljabar, teori ekuilibrium, serta perjuangannya melawan skizofrenia.",
      tahun: 1998,
      isbn: "0684819066",
      halaman: 461,
      penerbit: "Simon & Schuster"
    },
    {
      judul: "A Brief History of Time",
      penulis: "Stephen Hawking",
      kategori: "Sains",
      sinopsis: "Buku sains kosmologi populer paling ikonik sepanjang masa. Menjelaskan tentang hukum fisika teoretis, ruang dan waktu, teori Ledakan Besar (Big Bang), dimensi lubang hitam (black holes), relativitas umum Einstein, serta pencarian Unified Theory secara lugas.",
      tahun: 1988,
      isbn: "0553109537",
      halaman: 212,
      penerbit: "Bantam Books"
    },
    {
      judul: "The Design of Everyday Things",
      penulis: "Don Norman",
      kategori: "Desain",
      sinopsis: "Kitab suci para desainer antarmuka dan produk di seluruh dunia. Mengupas tuntas psikologi desain kognitif, konsep affordance, feedback loop, pemetaan fungsional, kegunaan praktis (usability), ergonomi visual, serta meminimalkan error pengguna.",
      tahun: 2002,
      isbn: "0465067107",
      halaman: 257,
      penerbit: "Basic Books"
    },
    {
      judul: "Doing Your Research Project",
      penulis: "Judith Bell",
      kategori: "Metode Penelitian",
      sinopsis: "Buku panduan metodologi penelitian akademik terapan yang sangat komprehensif. Menjelaskan taktik menyusun kuesioner, teknik wawancara, etika penelitian ilmiah, tinjauan pustaka, pengumpulan data empiris, pengujian reliabilitas instrumen, dan penulisan skripsi.",
      tahun: 1999,
      isbn: "0335203884",
      halaman: 256,
      penerbit: "Open University Press"
    },
    {
      judul: "Steve Jobs",
      penulis: "Walter Isaacson",
      kategori: "Teknologi",
      sinopsis: "Biografi komprehensif pendiri Apple Inc. yang menggabungkan revolusi teknologi dengan keindahan estetika desain produk. Mengulas proses berpikir kreatif di balik personal computer, ponsel pintar, antarmuka grafis modern, serta inovasi yang mengubah dunia.",
      tahun: 2011,
      isbn: "1451648537",
      halaman: 630,
      penerbit: "Simon & Schuster"
    },
    {
      judul: "Introduction to Algorithms",
      penulis: "Thomas H. Cormen",
      kategori: "Teknologi",
      sinopsis: "Buku referensi utama algoritma komputer dan pemrograman. Mengulas struktur data kompleks, algoritma pencarian biner, pengurutan cepat (sorting), pemrograman dinamis, grafis, heuristik, matematika pembuktian kompleksitas waktu O-Besar.",
      tahun: 2001,
      isbn: "0262032937",
      halaman: 1180,
      penerbit: "MIT Press"
    },
    {
      judul: "Tuesdays with Morrie",
      penulis: "Mitch Albom",
      kategori: "Bahasa",
      sinopsis: "Karya sastra non-fiksi terlaris di Book-Crossing. Menggunakan keindahan gaya bahasa reflektif dan komunikasi verbal interpersonal untuk menceritakan persahabatan, nilai-nilai kehidupan, empati, serta kebijaksanaan hidup seorang profesor sosiologi senja.",
      tahun: 1997,
      isbn: "0385484518",
      halaman: 192,
      penerbit: "Doubleday"
    },
    {
      judul: "Research Design: Qualitative, Quantitative, and Mixed Methods",
      penulis: "John W. Creswell",
      kategori: "Metode Penelitian",
      sinopsis: "Standard emas metodologi riset akademik tingkat lanjut. Panduan merancang hipotesis kuantitatif, paradigma kualitatif fenomenologis, serta metode campuran (mixed methods) lengkap dengan teknik pengolahan instrumen empiris.",
      tahun: 2003,
      isbn: "0761924422",
      halaman: 292,
      penerbit: "SAGE Publications"
    }
  ];

  // Map core books first
  for (const b of coreBooks) {
    books.push({
      id: currentId++,
      judul: b.judul,
      penulis: b.penulis,
      kategori: b.kategori as any,
      sinopsis: b.sinopsis,
      tahun: b.tahun,
      isbn: b.isbn,
      halaman: b.halaman,
      penerbit: b.penerbit,
      gradient: randOf(GRADIENTS_POOL)
    });
  }

  // Generate books systematically until we cross 1040 records
  const targetQuantity = 1040;
  let counter = 0;

  while (books.length < targetQuantity) {
    for (const cat of categories) {
      if (books.length >= targetQuantity) break;

      const theme = randOf(cat.themes);
      const titlePrefix = randOf(theme.titles);
      
      // Add volume, phase, or subtopic index to ensure uniqueness
      const numSuffix = Math.floor(1 + (counter / 6) % 99);
      const yearOffset = (counter * 3) % 45;
      const pagesCount = 100 + (counter * 13) % 780;
      const publicationYear = 2026 - (yearOffset % 28);
      const level = numSuffix % 3 === 0 ? "Dasar" : (numSuffix % 3 === 1 ? "Terapan" : "Lanjutan");
      const subTitleIndex = `Jilid ${Math.floor(numSuffix/10) + 1} (${level})`;

      const uniqueTitle = `${titlePrefix} ${subTitleIndex} - Seri ke-${numSuffix}`;
      const penulisName = randOf(AUTHORS_POOL);
      const synTitleWord = titlePrefix.split(" ")[0] || "katalog";
      
      const fullSynopsis = `${theme.synopsis_parts.opening} Buku ini berfokus khusus pada kajian teoritis tentang ${synTitleWord} yang dikaitkan dengan tantangan riset mahasiswa saat ini. ${theme.synopsis_parts.core} Melalui pemaparan bab terstruktur, penulis menyajikan ulasan studi literatur menyeluruh secara taktis. ${theme.synopsis_parts.closing}`;

      books.push({
        id: currentId++,
        judul: uniqueTitle,
        penulis: penulisName,
        kategori: cat.name as any,
        sinopsis: fullSynopsis,
        tahun: publicationYear,
        isbn: generateISBN(currentId),
        halaman: pagesCount,
        penerbit: randOf(PUBLISHERS_POOL),
        gradient: randOf(GRADIENTS_POOL)
      });

      counter++;
    }
  }

  return books;
}
