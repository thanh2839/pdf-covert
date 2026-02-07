const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { app } = require('electron');

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

  // Windows
  if (platform === 'win32') {
    const possiblePaths = [
      // Bundled portable LibreOffice
      path.join(bundledPath, 'App/libreoffice/program/soffice.exe'),
      path.join(bundledPath, 'program/soffice.exe'),
      path.join(devPath, 'App/libreoffice/program/soffice.exe'),
      path.join(devPath, 'program/soffice.exe'),
      // System installed
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
    // Kiểm tra file input tồn tại
    if (!fs.existsSync(inputFile)) {
      return reject(new Error(`Input file not found: ${inputFile}`));
    }

    // Tạo output directory
    if (!outputDir) {
      outputDir = path.join(os.tmpdir(), 'pdf-converter-output');
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Lấy đường dẫn LibreOffice
    let soffice;
    try {
      soffice = getLibreOfficePath();
    } catch (error) {
      return reject(error);
    }

    // Tạo command
    const command = `"${soffice}" --headless --convert-to pdf --outdir "${outputDir}" "${inputFile}"`;

    console.log('Converting with command:', command);

    // Thực thi command
    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Conversion error:', error);
        console.error('stderr:', stderr);
        return reject(new Error(`Conversion failed: ${error.message}`));
      }

      // Tạo đường dẫn file PDF output
      const inputBasename = path.basename(inputFile, path.extname(inputFile));
      const pdfPath = path.join(outputDir, `${inputBasename}.pdf`);

      // Kiểm tra file PDF đã được tạo
      if (fs.existsSync(pdfPath)) {
        console.log('Conversion successful:', pdfPath);
        resolve(pdfPath);
      } else {
        reject(new Error('PDF file was not created. Check LibreOffice installation.'));
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
 * Export file thành PNG images (thumbnails) sử dụng LibreOffice
 * Export tối đa 5 trang đầu tiên
 * Thường được dùng để extract thumbnails từ PDF sau khi convert
 * @param {string} inputFile - Đường dẫn file cần export (PDF, Word, Excel, etc.)
 * @param {string} outputDir - (Optional) Thư mục output, mặc định là temp folder
 * @param {number} maxPages - Số trang tối đa cần export (mặc định 5)
 * @returns {Promise<string[]>} - Mảng đường dẫn các file PNG đã export (tối đa 5 trang)
 */
function extractThumbnailsFromFile(inputFile, outputDir = null, maxPages = 5) {
  return new Promise((resolve, reject) => {
    // Kiểm tra file input tồn tại
    if (!fs.existsSync(inputFile)) {
      return reject(new Error(`Input file not found: ${inputFile}`));
    }

    // Tạo output directory
    if (!outputDir) {
      outputDir = path.join(os.tmpdir(), 'pdf-thumbnails');
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Lấy đường dẫn LibreOffice
    let soffice;
    try {
      soffice = getLibreOfficePath();
    } catch (error) {
      return reject(error);
    }

    // Tạo command để export PNG
    // LibreOffice sẽ tự động export mỗi trang thành một file PNG
    const command = `"${soffice}" --headless --convert-to png --outdir "${outputDir}" "${inputFile}"`;

    console.log('Exporting thumbnails with command:', command);

    // Thực thi command
    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Thumbnail export error:', error);
        console.error('stderr:', stderr);
        return reject(new Error(`Thumbnail export failed: ${error.message}`));
      }

      // LibreOffice tạo file PNG với format: {basename}_1.png, {basename}_2.png, ...
      const inputBasename = path.basename(inputFile, path.extname(inputFile));
      const thumbnailPaths = [];

      // Tìm tất cả các file PNG đã được tạo
      // LibreOffice có thể tạo: {basename}_1.png, {basename}_2.png, hoặc {basename}.png cho 1 trang
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        // Thử format với số trang: {basename}_1.png
        const thumbnailPath = path.join(outputDir, `${inputBasename}_${pageNum}.png`);
        if (fs.existsSync(thumbnailPath)) {
          thumbnailPaths.push(thumbnailPath);
        } else if (pageNum === 1) {
          // Nếu không có _1.png, thử {basename}.png (cho file 1 trang)
          const singlePagePath = path.join(outputDir, `${inputBasename}.png`);
          if (fs.existsSync(singlePagePath)) {
            thumbnailPaths.push(singlePagePath);
            break; // Chỉ có 1 trang
          }
        }
      }

      if (thumbnailPaths.length > 0) {
        console.log(`Successfully exported ${thumbnailPaths.length} thumbnails`);
        resolve(thumbnailPaths);
      } else {
        // Nếu không tìm thấy file theo pattern trên, tìm tất cả PNG trong thư mục
        const files = fs.readdirSync(outputDir);
        const pngFiles = files
          .filter(file => file.startsWith(inputBasename) && file.endsWith('.png'))
          .map(file => path.join(outputDir, file))
          .sort()
          .slice(0, maxPages);

        if (pngFiles.length > 0) {
          console.log(`Found ${pngFiles.length} PNG files by pattern matching`);
          resolve(pngFiles);
        } else {
          reject(new Error('No PNG files were created. Check LibreOffice installation and file format support.'));
        }
      }
    });
  });
}

module.exports = {
  convertToPDF,
  convertMultipleToPDF,
  getLibreOfficePath,
  extractThumbnailsFromFile
};
