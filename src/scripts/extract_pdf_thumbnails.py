import fitz
import os
import sys
import json

def extract_thumbnails(pdf_path, output_dir, max_pages=5, dpi=300):
    """
    Extract thumbnails from PDF using PyMuPDF (fitz).
    Returns JSON with list of saved image paths.
    """
    os.makedirs(output_dir, exist_ok=True)

    doc = fitz.open(pdf_path)
    zoom = dpi / 72
    matrix = fitz.Matrix(zoom, zoom)

    page_count = min(len(doc), max_pages)
    saved_paths = []

    for i in range(page_count):
        page = doc[i]
        pix = page.get_pixmap(matrix=matrix)
        basename = os.path.splitext(os.path.basename(pdf_path))[0]
        output_path = os.path.join(output_dir, f"{basename}_page_{i + 1}.png")
        pix.save(output_path)
        saved_paths.append(output_path)

    doc.close()

    # Output JSON for Node.js to parse
    print(json.dumps({"success": True, "paths": saved_paths, "pageCount": page_count}))

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Usage: python extract_pdf_thumbnails.py <pdf_path> <output_dir> [max_pages] [dpi]"}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]
    max_pages = int(sys.argv[3]) if len(sys.argv) > 3 else 5
    dpi = int(sys.argv[4]) if len(sys.argv) > 4 else 300

    try:
        extract_thumbnails(pdf_path, output_dir, max_pages, dpi)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
