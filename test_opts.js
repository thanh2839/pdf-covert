const { exec } = require('child_process');
exec('echo "pdf:calc_pdf_Export:{\\"SinglePageSheets\\\":{\\"type\\\":\\"boolean\\\",\\"value\\\":\\"true\\\"}}"', (e, stdout) => console.log(stdout));
