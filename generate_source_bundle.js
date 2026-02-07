const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const outputFile = path.join(rootDir, 'project_source_code.txt');

const includeExtensions = ['.js', '.jsx', '.css'];
const excludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.gemini', 'artifacts'];
const excludeFiles = ['package-lock.json', 'yarn.lock', 'generate_source_bundle.js', 'verify_optimization.js', 'debug_vehicles.js', 'debug_optimization_run.js', 'debug_routes.js'];

const pathsToScan = [
    path.join(rootDir, 'client', 'src'),
    path.join(rootDir, 'backend')
];

let fileCount = 0;
let outputContent = '';

function scanDirectory(directory) {
    if (!fs.existsSync(directory)) return;

    const items = fs.readdirSync(directory);

    for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!excludeDirs.includes(item)) {
                scanDirectory(fullPath);
            }
        } else {
            const ext = path.extname(item);
            if (includeExtensions.includes(ext) && !excludeFiles.includes(item)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const relativePath = path.relative(rootDir, fullPath);

                    outputContent += '\\n' + '='.repeat(50) + '\\n';
                    outputContent += `FILE: ${relativePath}\\n`;
                    outputContent += '='.repeat(50) + '\\n\\n';
                    outputContent += content + '\\n\\n';

                    fileCount++;
                    console.log(`Added: ${relativePath}`);
                } catch (err) {
                    console.error(`Error reading ${fullPath}:`, err);
                }
            }
        }
    }
}

console.log('Starting source code bundle generation...');

pathsToScan.forEach(dir => {
    scanDirectory(dir);
});

fs.writeFileSync(outputFile, outputContent);

console.log(`\\nDone! Bundled ${fileCount} files into ${outputFile}`);
