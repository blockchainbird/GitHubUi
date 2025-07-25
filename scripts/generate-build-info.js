#!/usr/bin/env node

import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const buildInfo = {
  timestamp: new Date().toISOString(),
  buildDate: new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })
};

const outputPath = 'src/generated/build-info.js';

// Ensure directory exists
mkdirSync(dirname(outputPath), { recursive: true });

// Generate the build info file
const content = `// This file is auto-generated during build
export const BUILD_INFO = ${JSON.stringify(buildInfo, null, 2)};
`;

writeFileSync(outputPath, content);

console.log(`Build info generated: ${buildInfo.buildDate}`);
