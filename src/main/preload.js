const { contextBridge, ipcRenderer } = require('electron');

// Expose các API an toàn cho renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Chọn files
  selectFiles: () => ipcRenderer.invoke('select-files'),

  // Chọn folder
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // Quét files trong folder (recursive)
  scanFolder: (folderPath) => ipcRenderer.invoke('scan-folder', folderPath),

  // Convert to PDF
  convertToPDF: (filePath) => ipcRenderer.invoke('convert-to-pdf', filePath),
  
  // Upload PDF
  uploadPDF: (pdfPath, apiUrl, apiKey) => ipcRenderer.invoke('upload-pdf', pdfPath, apiUrl, apiKey),
  
  // Convert và upload
  convertAndUpload: (filePath, apiUrl, apiKey) => ipcRenderer.invoke('convert-and-upload', filePath, apiUrl, apiKey),
  
  // Check LibreOffice
  checkLibreOffice: () => ipcRenderer.invoke('check-libreoffice'),

  // ==================== Auth APIs ====================
  
  // Admin login
  authLogin: (emailOrPhone, password) => ipcRenderer.invoke('auth-login', emailOrPhone, password),
  
  // Verify OTP
  authVerifyOtp: (userId, otp) => ipcRenderer.invoke('auth-verify-otp', userId, otp),

  // ==================== Document APIs ====================
  
  // Get document types
  getDocumentTypes: (token) => ipcRenderer.invoke('get-document-types', token),
  
  // Get packages
  getPackages: (token) => ipcRenderer.invoke('get-packages', token),
  
  // Get document categories
  getDocumentCategories: (token) => ipcRenderer.invoke('get-document-categories', token),
  
  // Get document sets
  getDocumentSets: (token) => ipcRenderer.invoke('get-document-sets', token),
  
  // Extract thumbnails from file (using LibreOffice - replaces PDF.js method)
  extractThumbnails: (filePath) => ipcRenderer.invoke('extract-thumbnails', filePath),
  
  // Extract PDF thumbnail (legacy - deprecated, use extractThumbnails instead)
  extractPdfThumbnail: (pdfPath) => ipcRenderer.invoke('extract-pdf-thumbnail', pdfPath),
  
  // Upload document
  uploadDocument: (token, documentData) => ipcRenderer.invoke('upload-document', token, documentData),

  // Update document (overwrite)
  updateDocument: (token, documentId, documentData) => ipcRenderer.invoke('update-document', token, documentId, documentData),

  // Get all documents (for duplicate check)
  getAllDocuments: (token) => ipcRenderer.invoke('get-all-documents', token),

  // Get documents
  getDocuments: (token, filters) => ipcRenderer.invoke('get-documents', token, filters),
  
  // Get document by ID
  getDocumentById: (token, documentId) => ipcRenderer.invoke('get-document-by-id', token, documentId),
  
  // Get document download URL
  getDocumentDownloadUrl: (token, documentId, fileName) => ipcRenderer.invoke('get-document-download-url', token, documentId, fileName),
  
  // Get document thumbnail URL (presigned URL)
  getDocumentThumbnailUrl: (token, documentId, thumbnailName) => ipcRenderer.invoke('get-document-thumbnail-url', token, documentId, thumbnailName),
  
  // Save file to local
  saveFileToLocal: (sourcePath, fileName) => ipcRenderer.invoke('save-file-to-local', sourcePath, fileName),
  
  // Open folder
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath)
});
