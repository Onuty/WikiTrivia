import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',retries:process.env.CI ? 1 : 0,use:{baseURL:'http://127.0.0.1:4173/WikiTrivia/',headless:true},webServer:{command:'npm run preview -- --port 4173',url:'http://127.0.0.1:4173/WikiTrivia/',reuseExistingServer:!process.env.CI},reporter:'list'});


