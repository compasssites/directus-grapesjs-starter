import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIRECTUS_URL = 'https://directus-oracle.panel.ballarihealth.com';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExNzkyNzZlLTk0ZjMtNDQ0Zi1hYzAzLTAyYzUyYjlmOGE3MiIsInJvbGUiOiI3YmIzY2IxZi0xNjQzLTQ3NTItYWZkOS1iMTgzYWViOTRiMzIiLCJhcHBfYWNjZXNzIjp0cnVlLCJhZG1pbl9hY2Nlc3MiOnRydWUsImlhdCI6MTc1MzU4ODk5MSwiZXhwIjoxNzUzNTg5ODkxLCJpc3MiOiJkaXJlY3R1cyJ9.UCAIu0sslRzh2_h3qcLQg-JV3IUh9k0rXQAk5ff0OWI';

async function testServer() {
  console.log('Testing Directus server connection...');
  
  try {
    // Test server info endpoint (no auth required)
    console.log('\n1. Testing server info endpoint...');
    const serverInfo = await fetch(`${DIRECTUS_URL}/server/info`);
    console.log(`Server info status: ${serverInfo.status} ${serverInfo.statusText}`);
    
    if (serverInfo.ok) {
      const data = await serverInfo.json();
      console.log('Server info:', JSON.stringify(data, null, 2));
    } else {
      const error = await serverInfo.text();
      console.error('Server info error:', error);
    }
    
    // Test authentication with token
    console.log('\n2. Testing authentication with token...');
    const authResponse = await fetch(`${DIRECTUS_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Auth status: ${authResponse.status} ${authResponse.statusText}`);
    
    if (authResponse.ok) {
      const userData = await authResponse.json();
      console.log('User data:', JSON.stringify(userData, null, 2));
    } else {
      const error = await authResponse.text();
      console.error('Auth error:', error);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testServer();
