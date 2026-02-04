const path = require('path')
const fs = require('fs')
const os = require('os')

/**
 * Extract first 5 pages of PDF as images using pdf.js
 * Returns array of paths to thumbnail images (up to 5 pages)
 */
async function extractPdfThumbnail(pdfPath, outputDir = null) {
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`)
  }

  // Create output directory
  if (!outputDir) {
    outputDir = path.join(os.tmpdir(), 'pdf-thumbnails')
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const pdfBasename = path.basename(pdfPath, '.pdf')
  const numPages = 5 // Extract first 5 pages

  console.log('Extracting thumbnails from PDF:', pdfPath)

  try {
    // Use legacy build for Node.js/Electron compatibility
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js')
    const { createCanvas } = require('canvas')

    // Load the PDF document
    const data = new Uint8Array(fs.readFileSync(pdfPath))
    const loadingTask = pdfjsLib.getDocument({ data })
    const pdfDoc = await loadingTask.promise

    const totalPages = Math.min(pdfDoc.numPages, numPages)
    const thumbnails = []

    console.log(`PDF has ${pdfDoc.numPages} pages, extracting first ${totalPages}`)

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum)

        // Scale for reasonable thumbnail size (150 DPI equivalent)
        const scale = 1.5
        const viewport = page.getViewport({ scale })

        // Create canvas
        const canvas = createCanvas(viewport.width, viewport.height)
        const context = canvas.getContext('2d')

        // Create a custom canvas factory for node-canvas compatibility
        const canvasFactory = {
          create: function (width, height) {
            const canvas = createCanvas(width, height)
            return {
              canvas,
              context: canvas.getContext('2d')
            }
          },
          reset: function (canvasAndContext, width, height) {
            canvasAndContext.canvas.width = width
            canvasAndContext.canvas.height = height
          },
          destroy: function (canvasAndContext) {
            canvasAndContext.canvas = null
            canvasAndContext.context = null
          }
        }

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvasFactory: canvasFactory
        }).promise

        // Save as PNG
        const outputPath = path.join(outputDir, `${pdfBasename}_thumb_${pageNum}.png`)
        const buffer = canvas.toBuffer('image/png')
        fs.writeFileSync(outputPath, buffer)

        thumbnails.push(outputPath)
        console.log(`Extracted page ${pageNum}: ${outputPath}`)
      } catch (pageError) {
        console.warn(`Failed to extract page ${pageNum}:`, pageError.message)
      }
    }

    console.log(`Successfully extracted ${thumbnails.length} thumbnails`)
    return thumbnails

  } catch (error) {
    console.error('PDF thumbnail extraction failed:', error.message)
    return []
  }
}

module.exports = {
  extractPdfThumbnail
}
