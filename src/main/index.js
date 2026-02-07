const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const os = require('os');
const { convertToPDF, getLibreOfficePath, extractThumbnailsFromFile } = require('./converter');
const { uploadToAPI } = require('./api');
const { authService, documentService, uploadToS3 } = require('../services/api');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  // Load signin page by default
  mainWindow.loadFile(path.join(__dirname, '../renderer/signin.html'));
  
  // Uncomment để debug
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ==================== IPC Handlers ====================

// Mở dialog chọn file
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Documents', extensions: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'pdf'] },
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result.filePaths;
});

// Mở dialog chọn folder
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0] || null;
});

// Quét tất cả files trong folder (recursive)
ipcMain.handle('scan-folder', async (event, folderPath) => {
  const supportedExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.bmp'];
  const files = [];

  function scanDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (supportedExtensions.includes(ext)) {
            files.push({
              path: fullPath,
              name: item,
              relativePath: path.relative(folderPath, fullPath)
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error.message);
    }
  }

  scanDirectory(folderPath);
  return files;
});

// Convert file sang PDF
ipcMain.handle('convert-to-pdf', async (event, filePath) => {
  try {
    const pdfPath = await convertToPDF(filePath);
    return { success: true, pdfPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Upload PDF lên API
ipcMain.handle('upload-pdf', async (event, pdfPath, apiUrl, apiKey) => {
  try {
    const result = await uploadToAPI(pdfPath, apiUrl, apiKey);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Convert và upload luôn
ipcMain.handle('convert-and-upload', async (event, filePath, apiUrl, apiKey) => {
  try {
    // Step 1: Convert
    const pdfPath = await convertToPDF(filePath);
    
    // Step 2: Upload
    const result = await uploadToAPI(pdfPath, apiUrl, apiKey);
    
    return { success: true, pdfPath, uploadResult: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Kiểm tra LibreOffice đã sẵn sàng chưa
ipcMain.handle('check-libreoffice', async () => {
  const loPath = getLibreOfficePath();
  return fs.existsSync(loPath);
});

// ==================== Auth Handlers ====================

// Admin login
ipcMain.handle('auth-login', async (event, emailOrPhone, password) => {
  try {
    const result = await authService.login(emailOrPhone, password);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Verify OTP
ipcMain.handle('auth-verify-otp', async (event, userId, otp) => {
  try {
    const result = await authService.verifyOtp(userId, otp);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ==================== Document Handlers ====================

// Get document types
ipcMain.handle('get-document-types', async (event, token) => {
  try {
    const result = await documentService.getDocumentTypes(token);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get packages
ipcMain.handle('get-packages', async (event, token) => {
  try {
    const result = await documentService.getPackages(token);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get document categories
ipcMain.handle('get-document-categories', async (event, token) => {
  try {
    const result = await documentService.getDocumentCategories(token);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get document sets
ipcMain.handle('get-document-sets', async (event, token) => {
  try {
    const result = await documentService.getDocumentSets(token);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Extract thumbnails from file using LibreOffice (returns array of up to 5 pages)
// This replaces the old PDF.js method - now exports directly from source file
ipcMain.handle('extract-thumbnails', async (event, filePath) => {
  try {
    const thumbnailPaths = await extractThumbnailsFromFile(filePath, null, 5);
    if (thumbnailPaths && Array.isArray(thumbnailPaths) && thumbnailPaths.length > 0) {
      return { success: true, thumbnailPaths };
    } else {
      // Thumbnail extraction failed but it's optional, so return success with empty array
      return { success: true, thumbnailPaths: [] };
    }
  } catch (error) {
    // If there's an actual error, still return success with empty array (thumbnails are optional)
    console.error('Thumbnail extraction error (non-critical):', error.message);
    return { success: true, thumbnailPaths: [] };
  }
});

// Legacy handler for backward compatibility (deprecated - use extract-thumbnails instead)
ipcMain.handle('extract-pdf-thumbnail', async (event, pdfPath) => {
  try {
    // Use new LibreOffice method instead of PDF.js
    const thumbnailPaths = await extractThumbnailsFromFile(pdfPath, null, 5);
    if (thumbnailPaths && Array.isArray(thumbnailPaths) && thumbnailPaths.length > 0) {
      return { success: true, thumbnailPaths };
    } else {
      return { success: true, thumbnailPaths: [] };
    }
  } catch (error) {
    console.error('Thumbnail extraction error (non-critical):', error.message);
    return { success: true, thumbnailPaths: [] };
  }
});

// Get documents
ipcMain.handle('get-documents', async (event, token, filters) => {
  try {
    const result = await documentService.getDocuments(token, filters);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get all documents (for duplicate check)
ipcMain.handle('get-all-documents', async (event, token) => {
  try {
    const result = await documentService.getAllDocuments(token);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Update document (overwrite existing)
ipcMain.handle('update-document', async (event, token, documentId, documentData) => {
  try {
    console.log('=== Update Document Debug ===');
    console.log('Document ID:', documentId);
    console.log('Document data:', documentData);

    const updateResponse = await documentService.updateDocument(token, documentId, {
      name: documentData.name,
      typeId: documentData.typeId,
      keptFiles: documentData.keptFiles || [],
      newFileNames: documentData.newFileNames || [],
      thumbnailNames: documentData.thumbnailNames
    });

    console.log('Update API Response:', JSON.stringify(updateResponse, null, 2));

    const results = {
      documentId: documentId,
      fileUploads: [],
      thumbnailUploads: []
    };

    // Upload new files to S3
    if (updateResponse.presigned_urls) {
      for (const presignedUrl of updateResponse.presigned_urls) {
        const filePath = documentData.filePaths[presignedUrl.file_name];
        if (filePath && fs.existsSync(filePath)) {
          try {
            await uploadToS3(presignedUrl.presigned_url, filePath);
            results.fileUploads.push({ fileName: presignedUrl.file_name, success: true });
          } catch (error) {
            results.fileUploads.push({ fileName: presignedUrl.file_name, success: false, error: error.message });
          }
        }
      }
    }

    // Upload thumbnails to S3
    const thumbnailS3Keys = {}; // Map file_name to s3_key
    if (updateResponse.thumbnail_presigned_urls) {
      for (const presignedUrl of updateResponse.thumbnail_presigned_urls) {
        const thumbnailPath = documentData.thumbnailPaths[presignedUrl.file_name];
        if (thumbnailPath && fs.existsSync(thumbnailPath)) {
          try {
            await uploadToS3(presignedUrl.presigned_url, thumbnailPath);
            results.thumbnailUploads.push({ fileName: presignedUrl.file_name, success: true });
            // Store s3_key from API response
            if (presignedUrl.s3_key) {
              thumbnailS3Keys[presignedUrl.file_name] = presignedUrl.s3_key;
            }
          } catch (error) {
            results.thumbnailUploads.push({ fileName: presignedUrl.file_name, success: false, error: error.message });
          }
        }
      }
    }

    // Update status to uploaded
    const allFileUploadsSuccess = results.fileUploads.every(u => u.success);
    if (allFileUploadsSuccess && results.fileUploads.length > 0) {
      try {
        await documentService.updateDocumentStatus(token, documentId, 'uploaded');
      } catch (error) {
        console.error('Failed to update document status:', error);
      }
    }

    return { 
      success: true, 
      data: {
        ...results,
        thumbnailS3Keys: thumbnailS3Keys // Return s3_keys for thumbnails
      }
    };
  } catch (error) {
    console.error('=== Update Document Error ===');
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    return { success: false, error: error.message };
  }
});

// Get document by ID
ipcMain.handle('get-document-by-id', async (event, token, documentId) => {
  try {
    const result = await documentService.getDocumentById(token, documentId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get document download URL
ipcMain.handle('get-document-download-url', async (event, token, documentId, fileName) => {
  try {
    const result = await documentService.getDocumentDownloadUrl(token, documentId, fileName);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get document thumbnail URL (presigned URL)
ipcMain.handle('get-document-thumbnail-url', async (event, token, documentId, thumbnailName) => {
  try {
    const result = await documentService.getDocumentThumbnailUrl(token, documentId, thumbnailName);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Save file to local directory
ipcMain.handle('save-file-to-local', async (event, sourcePath, fileName) => {
  try {
    // Create local directory for saved PDFs
    const documentsPath = path.join(os.homedir(), 'Documents', 'PDFConverter');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(documentsPath)) {
      fs.mkdirSync(documentsPath, { recursive: true });
    }
    
    // Destination path
    const destPath = path.join(documentsPath, fileName);
    
    // Copy file
    fs.copyFileSync(sourcePath, destPath);
    
    return { 
      success: true, 
      localPath: destPath,
      directory: documentsPath
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Open folder in file explorer
ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    shell.showItemInFolder(folderPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Upload document (with original file, PDF, and thumbnail)
ipcMain.handle('upload-document', async (event, token, documentData) => {
  try {
    console.log('=== Upload Document Debug ===');
    console.log('Document name:', documentData.name);
    console.log('File names:', documentData.fileNames);
    console.log('Thumbnail names:', documentData.thumbnailNames);
    console.log('Thumbnail paths:', documentData.thumbnailPaths);

    // Step 1: Create document and get presigned URLs
    const createResponse = await documentService.createDocument(token, {
      name: documentData.name,
      fileNames: documentData.fileNames, // Array of file names
      typeId: documentData.typeId,
      packageIds: documentData.packageIds,
      categoryIds: documentData.categoryIds,
      description: documentData.description,
      thumbnailNames: documentData.thumbnailNames
    });

    console.log('API Response:', JSON.stringify(createResponse, null, 2));

    const results = {
      documentId: createResponse.document_id,
      fileUploads: [],
      thumbnailUploads: []
    };

    // Step 2: Upload files to S3
    if (createResponse.presigned_urls) {
      for (const presignedUrl of createResponse.presigned_urls) {
        const filePath = documentData.filePaths[presignedUrl.file_name];
        if (filePath && fs.existsSync(filePath)) {
          try {
            await uploadToS3(presignedUrl.presigned_url, filePath);
            results.fileUploads.push({ fileName: presignedUrl.file_name, success: true });
          } catch (error) {
            results.fileUploads.push({ fileName: presignedUrl.file_name, success: false, error: error.message });
          }
        }
      }
    }

    // Step 3: Upload thumbnails to S3 (similar to CMS logic)
    const thumbnailS3Keys = {}; // Map file_name to s3_key
    const thumbnailUploadResults = []; // Track thumbnail upload results
    
    if (createResponse.thumbnail_presigned_urls && createResponse.thumbnail_presigned_urls.length > 0) {
      console.log('=== Thumbnail Presigned URLs ===');
      console.log('thumbnail_presigned_urls:', JSON.stringify(createResponse.thumbnail_presigned_urls, null, 2));
      
      for (const presignedUrl of createResponse.thumbnail_presigned_urls) {
        console.log(`Processing thumbnail: ${presignedUrl.file_name}, s3_key: ${presignedUrl.s3_key}`);
        const thumbnailPath = documentData.thumbnailPaths[presignedUrl.file_name];
        if (thumbnailPath && fs.existsSync(thumbnailPath)) {
          try {
            await uploadToS3(presignedUrl.presigned_url, thumbnailPath);
            thumbnailUploadResults.push({ fileName: presignedUrl.file_name, success: true });
            results.thumbnailUploads.push({ fileName: presignedUrl.file_name, success: true });
            // Store s3_key from API response
            if (presignedUrl.s3_key) {
              thumbnailS3Keys[presignedUrl.file_name] = presignedUrl.s3_key;
              console.log(`Stored s3_key for ${presignedUrl.file_name}: ${presignedUrl.s3_key}`);
            } else {
              console.warn(`No s3_key in presigned URL for ${presignedUrl.file_name}`);
            }
          } catch (error) {
            thumbnailUploadResults.push({ fileName: presignedUrl.file_name, success: false, error: error.message });
            results.thumbnailUploads.push({ fileName: presignedUrl.file_name, success: false, error: error.message });
            console.error(`Failed to upload thumbnail ${presignedUrl.file_name}:`, error);
          }
        } else {
          console.warn(`Thumbnail path not found for ${presignedUrl.file_name}: ${thumbnailPath}`);
          thumbnailUploadResults.push({ fileName: presignedUrl.file_name, success: false, error: 'Thumbnail path not found' });
        }
      }
      console.log('Final thumbnailS3Keys:', thumbnailS3Keys);
      console.log('Thumbnail upload results:', thumbnailUploadResults);
    } else {
      console.warn('No thumbnail_presigned_urls in createResponse');
    }

    // Step 4: Update document status to 'uploaded' if all uploads successful (similar to CMS)
    const allFileUploadsSuccess = results.fileUploads.every(u => u.success);
    const allThumbnailUploadsSuccess = thumbnailUploadResults.length === 0 || thumbnailUploadResults.every(u => u.success);
    
    if (allFileUploadsSuccess && allThumbnailUploadsSuccess) {
      try {
        await documentService.updateDocumentStatus(token, createResponse.document_id, 'uploaded');
        console.log('Document status updated to "uploaded"');
      } catch (error) {
        console.error('Failed to update document status:', error);
      }
    } else {
      console.warn('Not all uploads successful, keeping status as "pending"');
      const failedFiles = results.fileUploads.filter(u => !u.success).map(u => u.fileName);
      const failedThumbnails = thumbnailUploadResults.filter(u => !u.success).map(u => u.fileName);
      console.warn('Failed files:', failedFiles);
      console.warn('Failed thumbnails:', failedThumbnails);
    }

    const responseData = { 
      ...results, 
      documentId: createResponse.document_id,
      thumbnailS3Keys: thumbnailS3Keys // Return s3_keys for thumbnails
    };
    console.log('=== Upload Document Response ===');
    console.log('Response data:', JSON.stringify(responseData, null, 2));
    return { 
      success: true, 
      data: responseData
    };
  } catch (error) {
    console.error('=== Upload Document Error ===');
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    return { success: false, error: error.message };
  }
});
