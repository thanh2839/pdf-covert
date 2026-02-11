const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { app } = require('electron');

/**
 * Kill zombie soffice processes + toàn bộ process tree
 * Trên Windows khi exec timeout chỉ kill shell, soffice.bin vẫn sống
 * → phải kill bằng wmic để dọn hết
 */
function killAllSoffice() {
  if (process.platform === 'win32') {
    // PowerShell kill đáng tin cậy hơn wmic/taskkill trên Windows
    try {
      execSync('powershell -Command "Get-Process soffice* -ErrorAction SilentlyContinue | Stop-Process -Force"', { stdio: 'ignore', timeout: 10000 });
    } catch (e) {}
    // Fallback: taskkill
    try { execSync('taskkill /F /IM soffice.bin /T', { stdio: 'ignore', timeout: 5000 }); } catch (e) {}
    try { execSync('taskkill /F /IM soffice.exe /T', { stdio: 'ignore', timeout: 5000 }); } catch (e) {}
    try { execSync('taskkill /F /IM soffice.com /T', { stdio: 'ignore', timeout: 5000 }); } catch (e) {}
  } else {
    try { execSync('pkill -9 -f soffice', { stdio: 'ignore', timeout: 5000 }); } catch (e) {}
  }
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

  // Windows - dùng soffice.exe (exit ngay, soffice.bin chạy nền → poll chờ PDF)
  if (platform === 'win32') {
    const possiblePaths = [
      path.join(bundledPath, 'App/libreoffice/program/soffice.exe'),
      path.join(bundledPath, 'program/soffice.exe'),
      path.join(devPath, 'App/libreoffice/program/soffice.exe'),
      path.join(devPath, 'program/soffice.exe'),
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
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

    let soffice;
    try {
      soffice = getLibreOfficePath();
    } catch (error) {
      return reject(error);
    }

    // Kill zombie soffice + đợi thoát + xóa locks
    killAllSoffice();
    try { execSync('powershell -Command "Start-Sleep -Milliseconds 1500"', { stdio: 'ignore', timeout: 5000 }); } catch (e) {}

    const inputBasename = path.basename(inputFile, path.extname(inputFile));
    const pdfPath = path.join(outputDir, `${inputBasename}.pdf`);

    // Dọn file cũ + lock files
    try { if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath); } catch (e) {}
    try { fs.unlinkSync(path.join(outputDir, `.~lock.${inputBasename}.pdf#`)); } catch (e) {}
    try { fs.unlinkSync(path.join(path.dirname(inputFile), `.~lock.${path.basename(inputFile)}#`)); } catch (e) {}
    const sofficePath = path.dirname(soffice);
    const profileLock = path.join(path.resolve(sofficePath, '../../../Data/settings'), '.lock');
    try { if (fs.existsSync(profileLock)) fs.unlinkSync(profileLock); } catch (e) {}

    const args = [
      '--headless', '--norestore', '--nofirststartwizard', '--nologo',
      '--convert-to', 'pdf',
      '--outdir', outputDir,
      inputFile
    ];
    console.log('Converting with command:', soffice, args.join(' '));

    let settled = false;
    const child = spawn(soffice, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    let stdoutData = '';
    let stderrData = '';
    child.stdout.on('data', (d) => { stdoutData += d.toString(); });
    child.stderr.on('data', (d) => { stderrData += d.toString(); });

    function finish(success, result) {
      if (settled) return;
      settled = true;
      clearInterval(pollTimer);
      clearTimeout(timeoutTimer);
      if (stdoutData) console.log('LibreOffice stdout:', stdoutData.trim());
      if (stderrData) console.error('LibreOffice stderr:', stderrData.trim());
      if (success) {
        console.log('Conversion successful:', result);
        resolve(result);
      } else {
        // Chỉ kill khi thất bại - KHÔNG kill khi thành công (soffice.bin có thể đang dọn dẹp)
        try { child.kill(); } catch (e) {}
        killAllSoffice();
        reject(new Error(result));
      }
    }

    // Poll PDF song song - soffice.exe exit ngay, soffice.bin chạy nền convert
    // → poll là cách duy nhất để biết khi nào xong
    const POLL_INTERVAL = 1000;
    const pollTimer = setInterval(() => {
      if (settled) return;
      if (fs.existsSync(pdfPath)) {
        try {
          const size1 = fs.statSync(pdfPath).size;
          if (size1 > 0) {
            setTimeout(() => {
              if (settled) return;
              try {
                const size2 = fs.statSync(pdfPath).size;
                if (size2 > 0 && size1 === size2) {
                  finish(true, pdfPath);
                }
              } catch (e) {}
            }, 500);
          }
        } catch (e) {}
      }
    }, POLL_INTERVAL);

    // Timeout tổng: 3 phút
    const timeoutTimer = setTimeout(() => {
      finish(false, 'Conversion timeout after 3 minutes');
    }, 180000);

    child.on('error', (err) => {
      finish(false, `Failed to start LibreOffice: ${err.message}`);
    });

    // soffice.exe exit ngay → KHÔNG fail ở đây, để poll tiếp tục chờ PDF từ soffice.bin
    child.on('close', (code) => {
      console.log(`soffice.exe exited with code ${code}, soffice.bin converting in background...`);
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
  // Kiểm tra file input tồn tại
  if (!fs.existsSync(inputFile)) {
    throw new Error(`Input file not found: ${inputFile}`);
  }

  // Tạo output directory
  if (!outputDir) {
    outputDir = path.join(os.tmpdir(), 'pdf-thumbnails');
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let pdfFile = inputFile;
  const ext = path.extname(inputFile).toLowerCase();

  // File không phải PDF → convert sang PDF trước
  if (ext !== '.pdf') {
    console.log(`Converting ${inputFile} to PDF before extracting thumbnails...`);
    pdfFile = await convertToPDF(inputFile);
  }

  // Luôn dùng MuPDF để extract thumbnails từ PDF
  return extractThumbnailsFromPDF(pdfFile, outputDir, maxPages);
}

module.exports = {
  convertToPDF,
  convertMultipleToPDF,
  getLibreOfficePath,
  extractThumbnailsFromFile,
  extractThumbnailsFromPDF
};
