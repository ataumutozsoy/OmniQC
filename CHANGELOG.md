# Changelog

All notable changes to OmniQC will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-15

### Initial Release

#### Added
- **Project Management**
  - Create, delete, and organize projects
  - Drag & drop FASTQ file upload
  - Sample search and filtering

- **Quality Analysis**
  - Per Base Sequence Quality scoring
  - Per Sequence Quality distribution
  - Per Base Sequence Content (A/T/G/C/N)
  - Per Sequence GC Content distribution
  - Sequence Duplication Levels detection
  - Overrepresented Sequences identification
  - Adapter Content detection
  - N Content analysis

- **Quality Assessment**
  - Pass/Warn/Fail status for each metric
  - Overall sample quality scoring
  - Color-coded visual indicators

- **Visualization**
  - Interactive charts (line, bar, area)
  - Quality heatmaps
  - Distribution histograms

- **Export Options**
  - PDF reports with all metrics and charts
  - CSV export for downstream analysis
  - Project-level summary reports

- **User Interface**
  - Modern, intuitive design
  - Sidebar navigation
  - Real-time analysis progress
  - Help documentation

#### Technical
- Built with Electron + React
- Python backend for FASTQ parsing
- SQLite database for project storage
- Windows installer (NSIS)
