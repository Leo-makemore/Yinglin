#!/usr/bin/env node

/**
 * Script to fetch subscribers from Vercel and save to local file
 * 
 * Usage:
 *   node fetch-subscribers.js [website-url]
 * 
 * Example:
 *   node fetch-subscribers.js https://yinglin.vercel.app
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const WEBSITE_URL = process.argv[2] || process.env.WEBSITE_URL || 'https://yinglin.vercel.app';
const SUBSCRIBERS_FILE = path.join(__dirname, 'subscribers.json');

async function fetchSubscribers() {
  const url = new URL(`${WEBSITE_URL}/api/export-subscribers`);
  const client = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const result = JSON.parse(data);
            resolve(result.subscribers || []);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function main() {
  console.log(`Fetching subscribers from ${WEBSITE_URL}...`);

  try {
    const subscribers = await fetchSubscribers();
    
    if (subscribers.length === 0) {
      console.log('No subscribers found.');
      return;
    }

    // Save to local file
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
    
    console.log(`✓ Successfully fetched ${subscribers.length} subscribers`);
    console.log(`✓ Saved to ${SUBSCRIBERS_FILE}`);
    console.log('\nSubscribers:');
    subscribers.forEach((email, index) => {
      console.log(`  ${index + 1}. ${email}`);
    });
    
    console.log('\nYou can now send notifications using:');
    console.log('  npm run notify "Subject" "Message"');
  } catch (error) {
    console.error('Error fetching subscribers:', error.message);
    process.exit(1);
  }
}

main();

