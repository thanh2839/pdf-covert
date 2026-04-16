const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { app } = require('electron');

const EXCEL_EXTENSIONS = ['.xlsx', '.xls', '.xlsm', '.xlsb'];

function isExcelFile(filePath) {
  return EXCEL_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}

/**
 * Preprocess Excel: đặt tất cả sheets về fit-to-1-page trước khi convert sang PDF
 * Tránh trường hợp sheet bị cắt thành nhiều trang PDF
 * @returns {string|null} đường dẫn file tạm đã xử lý, hoặc null nếu thất bại
 */
function preprocessExcelFitToPage(inputFile) {
  let XLSX;
  try {
    XLSX = require('xlsx');
  } catch (e) {
    console.warn('xlsx package not available, skipping Excel fit-to-page preprocessing:', e.message);
    return null;
  }

  const workbook = XLSX.readFile(inputFile);

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    sheet['!pageSetup'] = {
      ...(sheet['!pageSetup'] || {}),
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
    };
  }

  const tempDir = path.join(os.tmpdir(), 'pdf-converter-excel-temp', `${Date.now()}`);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  // Giữ nguyên tên gốc để LibreOffice tạo PDF cùng tên
  const tempFile = path.join(tempDir, `${path.basename(inputFile, path.extname(inputFile))}.xlsx`);
  XLSX.writeFile(workbook, tempFile, { bookType: 'xlsx' });
  console.log(`Preprocessed Excel with fit-to-page: ${tempFile}`);
  return tempFile;
}

/**
 * Lấy đường dẫn tới LibreOffice
 * - Development: Tìm trong folder libreoffice/ của project
 * - Production: Tìm trong resources/libreoffice/ của app đã build
 * - Fallback: Tìm LibreOffice đã cài trên hệ thống
 */
function getLibreOfficePath() {
  const platform = process.platform;

  // Đường dẫn trong app đã đóng gói
  const resourcesPath = process.resourcesPath || path.join(__dirname, '../../');
  const bundledPath = path.join(resourcesPath, 'libreoffice');

  // Đường dẫn development
  const devPath = path.join(__dirname, '../../libreoffice');

  console.log(`[LibreOffice] getLibreOfficePath() platform=${platform}`);
  console.log(`[LibreOffice] resourcesPath=${resourcesPath}`);
  console.log(`[LibreOffice] bundledPath=${bundledPath}`);
  console.log(`[LibreOffice] devPath=${devPath}`);

  // Windows
  if (platform === 'win32') {
    const possiblePaths = [
      path.join(bundledPath, 'App/libreoffice/program/soffice.com'),
      path.join(bundledPath, 'App/libreoffice/program/soffice.exe'),
      path.join(bundledPath, 'program/soffice.com'),
      path.join(bundledPath, 'program/soffice.exe'),
      path.join(devPath, 'App/libreoffice/program/soffice.com'),
      path.join(devPath, 'App/libreoffice/program/soffice.exe'),
      path.join(devPath, 'program/soffice.com'),
      path.join(devPath, 'program/soffice.exe'),
      'C:\\Program Files\\LibreOffice\\program\\soffice.com',
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    ];

    console.log('[LibreOffice] Checking paths:');
    for (const p of possiblePaths) {
      const exists = fs.existsSync(p);
      console.log(`[LibreOffice]   ${exists ? '✓' : '✗'} ${p}`);
      if (exists) {
        return p;
      }
    }
  }

  // macOS
  if (platform === 'darwin') {
    const possiblePaths = [
      path.join(bundledPath, 'LibreOffice.app/Contents/MacOS/soffice'),
      path.join(devPath, 'LibreOffice.app/Contents/MacOS/soffice'),
      '/Applications/LibreOffice.app/Contents/MacOS/soffice',
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
  }

  // Linux
  if (platform === 'linux') {
    const possiblePaths = [
      path.join(bundledPath, 'program/soffice'),
      path.join(devPath, 'program/soffice'),
      '/usr/bin/soffice',
      '/usr/bin/libreoffice',
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
  }

  throw new Error('LibreOffice not found! Please install LibreOffice or add portable version to libreoffice/ folder');
}

/**
 * Convert file sang PDF sử dụng LibreOffice
 * @param {string} inputFile - Đường dẫn file cần convert
 * @param {string} outputDir - (Optional) Thư mục output, mặc định là temp folder
 * @returns {Promise<string>} - Đường dẫn file PDF đã convert
 */
function convertToPDF(inputFile, outputDir = null) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputFile)) {
      return reject(new Error(`Input file not found: ${inputFile}`));
    }

    if (!outputDir) {
      outputDir = path.join(os.tmpdir(), 'pdf-converter-output');
    }
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`[LibreOffice] Input: ${inputFile}`);
    console.log(`[LibreOffice] Output dir: ${outputDir}`);

    // Excel: re-export qua SheetJS để strip styles/VBA phức tạp mà portable LibreOffice không handle được
    // Đồng thời set fit-to-1-page để mỗi sheet = 1 trang PDF
    let fileToConvert = inputFile;
    let tempExcelFile = null;
    if (isExcelFile(inputFile)) {
      console.log(`[LibreOffice] Passing Excel file directly to preserve formatting: ${inputFile}`);
      // NOTE: We intentionally skip preprocessExcelFitToPage (SheetJS) here 
      // because the free version of SheetJS drops all styling, borders, colors, and layout properties.
      // Passing it directly allows LibreOffice to maintain the visual fidelity of the original Excel sheet.
    }

    // Copy file sang tên ASCII tạm nếu tên gốc chứa non-ASCII (tiếng Việt, ký tự đặc biệt)
    // LibreOffice trên Windows đôi khi không handle Unicode path → PDF không được tạo
    let tempAsciiFile = null;
    const hasNonAscii = /[^\x00-\x7F]/.test(fileToConvert);
    console.log(`[LibreOffice] filename hasNonAscii=${hasNonAscii}: "${path.basename(fileToConvert)}"`);
    if (hasNonAscii) {
      try {
        const asciiTempDir = path.join(os.tmpdir(), 'pdf-converter-ascii-temp');
        if (!fs.existsSync(asciiTempDir)) fs.mkdirSync(asciiTempDir, { recursive: true });
        const safeBasename = `convert_${Date.now()}${path.extname(fileToConvert)}`;
        const asciiTempPath = path.join(asciiTempDir, safeBasename);
        fs.copyFileSync(fileToConvert, asciiTempPath);
        tempAsciiFile = asciiTempPath;
        fileToConvert = asciiTempPath;
        console.log(`[LibreOffice] Copied non-ASCII file to ASCII temp: ${asciiTempPath}`);
      } catch (e) {
        console.warn('[LibreOffice] Failed to copy to ASCII temp path, using original:', e.message);
      }
    }

    // Lấy đường dẫn LibreOffice
    let soffice;
    try {
      soffice = getLibreOfficePath();
      console.log(`[LibreOffice] Using: ${soffice}`);
    } catch (error) {
      console.error('[LibreOffice] Not found:', error.message);
      if (tempExcelFile) try { fs.unlinkSync(tempExcelFile); } catch (e) {}
      if (tempAsciiFile) try { fs.unlinkSync(tempAsciiFile); } catch (e) {}
      return reject(error);
    }

    // PDF output path
    const inputBasename = path.basename(inputFile, path.extname(inputFile));
    const convertBasename = path.basename(fileToConvert, path.extname(fileToConvert));
    const pdfPath = path.join(outputDir, `${inputBasename}.pdf`);
    const convertPdfPath = path.join(outputDir, `${convertBasename}.pdf`);
    console.log(`[LibreOffice] expected PDF (final): ${pdfPath}`);
    if (tempAsciiFile) console.log(`[LibreOffice] expected PDF (from soffice): ${convertPdfPath}`);

    // Chờ PDF xuất hiện (soffice.exe có thể exit sớm trước khi soffice.bin convert xong)
    const waitForPdf = (targetPath, maxWait = 30000) => {
      return new Promise((res) => {
        if (fs.existsSync(targetPath)) return res(true);
        let waited = 0;
        const interval = setInterval(() => {
          waited += 500;
          if (fs.existsSync(targetPath)) {
            clearInterval(interval);
            res(true);
          } else if (waited >= maxWait) {
            clearInterval(interval);
            res(false);
          }
        }, 500);
      });
    };

    const runConversion = (srcFile, onDone) => {
      const srcBasename = path.basename(srcFile, path.extname(srcFile));
      const srcPdfPath = path.join(outputDir, `${srcBasename}.pdf`);
      
      const { execFile } = require('child_process');
      const os = require('os');
      const tempProfile = path.join(os.tmpdir(), 'pdf-converter-lo-profile').replace(/\\/g, '/');
      const profileUrl = `file:///${tempProfile}`;
      
      const args = [`-env:UserInstallation=${profileUrl}`, '--headless', '--convert-to'];
      
      if (isExcelFile(inputFile)) {
        // Truyền cấu hình dưới dạng tham số nguyên bản để không bị CMD làm hỏng ngoặc kép
        args.push('pdf:calc_pdf_Export:{"SinglePageSheets":{"type":"boolean","value":"true"}}');
      } else {
        args.push('pdf');
      }
      args.push('--outdir', outputDir, srcFile);
      
      console.log(`[LibreOffice] Executing: "${soffice}" ${args.join(' ')}`);
      execFile(soffice, args, { timeout: 300000 }, async (error, stdout, stderr) => {
        let loStdout = stdout ? stdout.trim() : '';
        let loStderr = stderr ? stderr.trim() : '';
        if (loStdout) console.log('[LibreOffice] stdout:', loStdout);
        if (loStderr) console.error('[LibreOffice] stderr:', loStderr);

        // soffice.exe trên Windows có thể exit sớm → poll chờ PDF
        // soffice.com có thể exit 0 nhưng in lỗi ra stdout
        if (!error && !fs.existsSync(srcPdfPath)) {
          if (loStdout.includes('Error:')) {
             error = new Error(`LibreOffice Error: ${loStdout}`);
          } else {
             console.log('[LibreOffice] PDF not found yet, waiting for soffice.bin to finish...');
             await waitForPdf(srcPdfPath);
          }
        }

        onDone(error, loStderr || loStdout, srcPdfPath);
      });
    };

    const cleanup = () => {
      if (tempExcelFile) try { fs.unlinkSync(tempExcelFile); } catch (e) {}
      if (tempAsciiFile) try { fs.unlinkSync(tempAsciiFile); } catch (e) {}
    };

    runConversion(fileToConvert, (error, stdinfo, srcPdfPath) => {
      cleanup();
      if (error) {
        console.error('[LibreOffice] exec error:', error.message);
        let errorMsg = `Conversion failed: ${error.message}`;
        if (stdinfo) errorMsg += `\nLibreOffice Output: ${stdinfo}`;
        return reject(new Error(errorMsg));
      }
      
      if (tempAsciiFile && srcPdfPath !== pdfPath && fs.existsSync(srcPdfPath)) {
        try {
          fs.renameSync(srcPdfPath, pdfPath);
          console.log(`[LibreOffice] Renamed: ${srcPdfPath} → ${pdfPath}`);
        } catch (e) {
          console.warn('[LibreOffice] Rename failed:', e.message);
        }
      }

      if (fs.existsSync(pdfPath)) {
        console.log('[LibreOffice] Conversion successful:', pdfPath);
        resolve(pdfPath);
      } else {
        console.error(`[LibreOffice] PDF not found at: ${pdfPath}`);
        let errMsg = 'PDF file was not created. File may be unsupported or too complex for LibreOffice.';
        if (error) { errMsg += ` ${error.message}`; }
        else if (stdinfo) { errMsg += ` LibreOffice info: ${stdinfo}`; }
        reject(new Error(errMsg));
      }
    });
  });
}

/**
 * Convert nhiều file cùng lúc
 * @param {string[]} inputFiles - Mảng đường dẫn files
 * @param {string} outputDir - Thư mục output
 * @returns {Promise<string[]>} - Mảng đường dẫn PDF files
 */
async function convertMultipleToPDF(inputFiles, outputDir = null) {
  const results = [];

  for (const file of inputFiles) {
    try {
      const pdfPath = await convertToPDF(file, outputDir);
      results.push({ file, pdfPath, success: true });
    } catch (error) {
      results.push({ file, error: error.message, success: false });
    }
  }

  return results;
}

/**
 * Extract thumbnails từ file PDF sử dụng MuPDF.js (npm package)
 * @param {string} pdfFile - Đường dẫn file PDF
 * @param {string} outputDir - Thư mục output
 * @param {number} maxPages - Số trang tối đa (mặc định 5)
 * @param {number} dpi - Độ phân giải (mặc định 300)
 * @returns {Promise<string[]>} - Mảng đường dẫn các file PNG
 */
async function extractThumbnailsFromPDF(pdfFile, outputDir, maxPages = 5, dpi = 300) {
  // mupdf là ESM module, cần dùng dynamic import
  const mupdf = await import('mupdf');

  console.log(`Extracting PDF thumbnails with MuPDF.js: ${pdfFile}`);

  const fileBuffer = fs.readFileSync(pdfFile);
  const doc = mupdf.Document.openDocument(fileBuffer, 'application/pdf');

  const pageCount = Math.min(doc.countPages(), maxPages);
  const scale = dpi / 72;
  const matrix = mupdf.Matrix.scale(scale, scale);
  const savedPaths = [];

  const basename = path.basename(pdfFile, path.extname(pdfFile));

  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i);
    const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
    const pngBuffer = pixmap.asPNG();

    const outputPath = path.join(outputDir, `${basename}_page_${i + 1}.png`);
    fs.writeFileSync(outputPath, pngBuffer);
    savedPaths.push(outputPath);

    console.log(`Saved thumbnail: ${outputPath}`);
  }

  console.log(`MuPDF.js extracted ${savedPaths.length} thumbnails`);
  return savedPaths;
}

/**
 * Export file thành PNG images (thumbnails)
 * Luôn dùng MuPDF.js - nếu file không phải PDF thì convert sang PDF trước
 * @param {string} inputFile - Đường dẫn file cần export (PDF, Word, Excel, etc.)
 * @param {string} outputDir - (Optional) Thư mục output, mặc định là temp folder
 * @param {number} maxPages - Số trang tối đa cần export (mặc định 5)
 * @returns {Promise<string[]>} - Mảng đường dẫn các file PNG đã export (tối đa 5 trang)
 */
async function extractThumbnailsFromFile(inputFile, outputDir = null, maxPages = 5) {
  if (!fs.existsSync(inputFile)) {
    throw new Error(`Input file not found: ${inputFile}`);
  }

  if (!outputDir) {
    outputDir = path.join(os.tmpdir(), 'pdf-thumbnails');
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let pdfFile = inputFile;
  const ext = path.extname(inputFile).toLowerCase();

  // File khác không phải PDF → convert sang PDF trước
  if (ext !== '.pdf') {
    console.log(`Converting ${inputFile} to PDF before extracting thumbnails...`);
    pdfFile = await convertToPDF(inputFile);
  }

  // Luôn dùng MuPDF để extract thumbnails từ PDF (PDF này đã được cấu hình 1 sheet = 1 PDF Page đối với Excel)
  return extractThumbnailsFromPDF(pdfFile, outputDir, maxPages);
}

module.exports = {
  convertToPDF,
  convertMultipleToPDF,
  getLibreOfficePath,
  extractThumbnailsFromFile,
  extractThumbnailsFromPDF
};
