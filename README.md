# OmniQC

<div align="center">

![OmniQC Logo](src/assets/icons/omniqc_logo.png)

### Modern FASTQ Quality Control Application
### Modern FASTQ Kalite Kontrol Uygulamasi

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/insilico/omniqc)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)](https://github.com/insilico/omniqc)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**OmniQC** is a powerful, user-friendly desktop application for analyzing FASTQ sequencing data quality. Built for bioinformaticians who need fast, reliable quality control insights.

**OmniQC**, FASTQ sekanslama verisi kalitesini analiz etmek icin guclu ve kullanici dostu bir masaustu uygulamasidir. Hizli ve guvenilir kalite kontrol bilgisine ihtiyac duyan biyoinformatik uzmanlari icin gelistirilmistir.

[Features](#features) | [Ozellikler](#ozellikler) | [Installation](#installation) | [Kurulum](#kurulum) | [License](#license)

</div>

---

## Features

### Comprehensive Quality Metrics
- **Per Base Sequence Quality** - Phred score distribution across read positions
- **Per Sequence Quality Scores** - Overall quality distribution per read
- **Per Base Sequence Content** - A/T/G/C/N distribution analysis
- **GC Content Distribution** - Per-sequence GC percentage
- **Sequence Duplication Levels** - Library complexity assessment
- **Adapter Content Detection** - Illumina adapter contamination check
- **N Content Analysis** - Ambiguous base detection

### Quality Assessment
- **Pass/Warn/Fail** status for each metric
- **Overall sample quality** scoring
- Color-coded visual indicators

### Project Management
- Organize samples into projects
- Batch analysis with progress tracking
- Sample search and filtering

### Professional Reports
- **PDF Export** - Detailed multi-page reports with all metrics
- **CSV Export** - Raw data for downstream analysis
- **Project Reports** - Summary across multiple samples

---

## Ozellikler

### Kapsamli Kalite Metrikleri
- **Baz Bazinda Sekans Kalitesi** - Okuma pozisyonlarinda Phred skor dagilimi
- **Sekans Basina Kalite Skorlari** - Okuma basina genel kalite dagilimi
- **Baz Bazinda Sekans Icerigi** - A/T/G/C/N dagilim analizi
- **GC Icerigi Dagilimi** - Sekans basina GC yuzdesi
- **Sekans Duplikasyon Seviyeleri** - Kutuphane karmasikligi degerlendirmesi
- **Adapter Icerigi Tespiti** - Illumina adapter kontaminasyonu kontrolu
- **N Icerigi Analizi** - Belirsiz baz tespiti

### Kalite Degerlendirmesi
- Her metrik icin **Gecti/Uyari/Basarisiz** durumu
- **Genel ornek kalitesi** puanlamasi
- Renk kodlu gorsel gostergeler

### Proje Yonetimi
- Ornekleri projelere organize etme
- Ilerleme takipli toplu analiz
- Ornek arama ve filtreleme

### Profesyonel Raporlar
- **PDF Disari Aktarimi** - Tum metriklerle detayli cok sayfalik raporlar
- **CSV Disari Aktarimi** - Alt akis analizi icin ham veri
- **Proje Raporlari** - Birden fazla ornek icin ozet

---

## Installation

### Windows
1. Download `OmniQC-1.0.0-Setup.exe` from [Releases](https://github.com/insilico/omniqc/releases)
2. Run the installer
3. Launch OmniQC from Start Menu or Desktop

### From Source
```bash
# Clone repository
git clone https://github.com/insilico/omniqc.git
cd omniqc

# Install dependencies
npm install
pip install -r requirements.txt

# Run in development mode
npm run dev

# Build for production
npm run electron:build
```

---

## Kurulum

### Windows
1. [Releases](https://github.com/insilico/omniqc/releases) sayfasindan `OmniQC-1.0.0-Setup.exe` dosyasini indirin
2. Yukleyiciyi calistirin
3. Baslat Menusu veya Masaustunden OmniQC'yi baslatnin

### Kaynak Koddan
```bash
# Depoyu klonlayin
git clone https://github.com/insilico/omniqc.git
cd omniqc

# Bagimililklari yukleyin
npm install
pip install -r requirements.txt

# Gelistirme modunda calistirin
npm run dev

# Uretim icin derleyin
npm run electron:build
```

---

## Usage / Kullanim

### Quick Start / Hizli Baslangic

**English:**
1. **Create a Project** - Click "New Project" in the toolbar
2. **Upload Samples** - Drag and drop FASTQ files (.fastq, .fq, .gz)
3. **Analyze** - Click play button on each sample or use "Analyze All"
4. **View Results** - Switch to Analysis tab to see the dashboard

**Turkce:**
1. **Proje Olusturun** - Arac cubugundan "New Project" tiklayin
2. **Ornekleri Yukleyin** - FASTQ dosyalarini surukleyip birakin (.fastq, .fq, .gz)
3. **Analiz Edin** - Her ornekte oynat butonuna tiklayin veya "Analyze All" kullanin
4. **Sonuclari Goruntuleyun** - Dashboard'u gormek icin Analysis sekmesine gecin

### Supported Formats / Desteklenen Formatlar
- `.fastq` / `.fq` - Standard FASTQ
- `.fastq.gz` / `.fq.gz` - Gzip compressed FASTQ

---

## Export Options / Disari Aktarma Secenekleri

| Format | Description / Aciklama |
|--------|------------------------|
| **PDF** | Professional multi-page report / Profesyonel cok sayfalik rapor |
| **CSV** | Raw metrics data for analysis / Analiz icin ham metrik verileri |

---

## Tech Stack / Teknik Altyapi

- **Frontend**: React, Recharts, TailwindCSS
- **Desktop**: Electron
- **Backend**: Python (FASTQ parsing, SQLite database)
- **Build**: Vite, electron-builder

---

## Requirements / Gereksinimler

- **OS / Isletim Sistemi**: Windows 10/11 (64-bit)
- **RAM**: 4GB minimum, 8GB recommended / 4GB minimum, 8GB onerilen
- **Storage / Depolama**: 500MB

---

## License / Lisans

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Bu proje MIT Lisansi altinda lisanslanmistir - detaylar icin [LICENSE](LICENSE) dosyasina bakiniz.

---

## Author / Yazar

**In Silico Bioinformatics**

---

<div align="center">

Made for the bioinformatics community

Biyoinformatik toplulugu icin gelistirilmistir

</div>
