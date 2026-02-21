#!/usr/bin/env node
// Test GitHub API
import dotenv from 'dotenv';
dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER || 'Nadir-DNA';

async function testGitHub() {
  console.log('🧪 Test GitHub API...');
  console.log('Token présent:', GITHUB_TOKEN ? 'Oui' : 'Non');
  console.log('Token (début):', GITHUB_TOKEN?.substring(0, 10) + '...');
  
  // Test auth
  const authRes = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
  });
  console.log('Auth status:', authRes.status);
  const authData = await authRes.json();
  console.log('Login:', authData.login);
  
  // Test création repo
  console.log('📦 Test création repo...');
  const repoRes = await fetch(`https://api.github.com/user/repos`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'test-repo-sitevitrine',
      private: false,
      auto_init: true
    })
  });
  
  console.log('Repo creation status:', repoRes.status);
  const repoData = await repoRes.json();
  console.log('Message:', repoData.message || 'OK');
  
  // Clean up
  if (repoRes.status === 201) {
    await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/test-repo-sitevitrine`, {
      method: 'DELETE',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    console.log('🗑️ Repo de test supprimé');
  }
}

testGitHub().catch(console.error);
