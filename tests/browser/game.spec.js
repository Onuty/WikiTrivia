import { test, expect } from '@playwright/test';
import { events } from '../../src/data/events.js';
import { isCorrectPosition } from '../../src/game.js';
async function choose(page, correct) {
 const title = await page.locator('#question h2').textContent();
 const event = events.find(e=>e.title===title);
 const ids = await page.locator('.timeline-card').evaluateAll(cards=>cards.map(c=>c.dataset.id));
 const timeline=ids.map(id=>events.find(e=>e.id===id));
 const index=Array.from({length:timeline.length+1},(_,i)=>i).find(i=>isCorrectPosition(timeline,event.year,i)===correct);
 await page.locator(`.insert[data-index="${index}"]`).click();
 await page.locator('.confirm').click();
 await expect(page.locator('.continue')).toBeEnabled();
 return event;
}
for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[768,1024],[390,844],[375,667]]) {
 test(`版面 ${width}×${height}`,async({page})=>{
  await page.setViewportSize({width,height});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('');
  await expect(page.locator('h1')).toContainText('放回');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.screenshot({path:`test-results/landing-${width}.png`,fullPage:true,animations:'disabled'});
  await page.locator('.start').click();
  await expect(page.locator('.timeline-card')).toHaveCount(2);
  await expect(page.locator('.hidden-year')).toContainText('？');
  await page.screenshot({path:`test-results/game-${width}.png`,fullPage:true,animations:'disabled'});
  await choose(page,true);
  await expect(page.locator('#score')).toHaveText('100');
  await expect(page.locator('.timeline-card')).toHaveCount(3);
  await expect(page.locator('.feedback')).toContainText('答對了');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  expect(errors).toEqual([]);
 });
}
test('生命、最高分、結算、重新開始與深色模式',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('');await page.locator('.theme').click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.locator('.start').click();await choose(page,true);await page.locator('.continue').click();
 await choose(page,true);await expect(page.locator('#score')).toHaveText('220');await page.locator('.continue').click();
 for(let i=0;i<3;i++){await choose(page,false);await expect(page.locator('#hearts')).toHaveAttribute('aria-label',`剩餘 ${2-i} 顆心`);await expect(page.locator('.placement-label')).toContainText('正確位置');await page.locator('.continue').click();}
 await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('.result-score')).toHaveText('220');
 await page.screenshot({path:'test-results/gameover.png'});
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('wt-high')))).toBe(220);
 await page.locator('.restart').click();await expect(page.locator('#score')).toHaveText('0');await expect(page.locator('.timeline-card')).toHaveCount(2);
 await page.reload();await expect(page.locator('.hero-facts')).toContainText('220');
});
test('每日挑戰十題、分數與鍵盤操作',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('');await page.locator('.daily').click();
 const first=await page.locator('#question h2').textContent();
 for(let i=0;i<10;i++){await choose(page,true);await page.locator('.continue').click();}
 await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('.result-score')).toHaveText('1,900');
 await page.locator('.restart').click();await expect(page.locator('#question h2')).toHaveText(first);
 await page.locator('.insert').first().focus();await page.keyboard.press('Enter');await expect(page.locator('.confirm')).toBeEnabled();
 await page.locator('.confirm').focus();await page.keyboard.press('Enter');await expect(page.locator('.continue')).toBeEnabled();
});
test('手機長時間軸、長標題、結果面板、儲存不可用與重新整理',async({page})=>{
 await page.setViewportSize({width:375,height:667});await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('儲存被停用');};});
 await page.goto('');await page.locator('.daily').click();
 for(let i=0;i<10;i++){await choose(page,true);await page.locator('.continue').click();}
 const box=await page.getByRole('dialog').boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(667);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.screenshot({path:'test-results/mobile-result.png'});await page.reload();await expect(page.locator('.start')).toBeVisible();
});

