import './style.css';
import { events } from './data/events.js';
import { formatYear, isCorrectPosition, correctIndex, pointsFor, filterEvents, makeDeck, seededRandom } from './game.js';

const app = document.querySelector('#app');
const icons = {
  mark: '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M9 5h14M9 27h14M11 5c0 9 10 13 10 22M21 5c0 9-10 13-10 22" stroke="currentColor" stroke-width="1.8"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z" stroke="currentColor" stroke-width="1.7"/></svg>',
};
function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 私密瀏覽仍可遊玩 */ } }
let high = Number(read('wt-high', 0));
if (!Number.isFinite(high) || high < 0) high = 0;
let recent = read('wt-recent', []);
if (!Array.isArray(recent)) recent = [];
let dark = read('wt-dark', matchMedia('(prefers-color-scheme: dark)').matches);
let filter = '全部';
let state;
let timer;
let run = 0;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const dateKey = () => new Intl.DateTimeFormat('sv-SE', {year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function setTheme() { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }
setTheme();
function header() {
  return `<header class="header"><a class="brand" href="#" aria-label="世界史時間線，回到首頁"><span class="brand-mark">${icons.mark}</span><span>世界史<span class="brand-light">時間線</span></span></a><div class="header-right"><span class="header-note">每個時代，都有它的位置。</span><button class="icon-button theme" aria-label="切換至${dark ? '淺色' : '深色'}模式">${icons.moon}</button></div></header>`;
}
function wireHeader() {
  document.querySelector('.theme').onclick = () => { dark = !dark; setTheme(); save('wt-dark', dark); document.querySelector('.theme').setAttribute('aria-label', `切換至${dark ? '淺色' : '深色'}模式`); };
  document.querySelector('.brand').onclick = e => { e.preventDefault(); if (state && !state.ended) { showExit(); } else landing(); };
}
function landing() {
  clearTimeout(timer); run++; state = null;
  app.innerHTML = `${header()}<main class="landing enter"><div class="hero-copy"><p class="eyebrow"><span></span> 一場穿越文明的時間旅行</p><h1>把歷史，<br>放回<span class="accent">時間裡。</span></h1><p class="hero-question">你真的知道歷史發生的先後順序嗎？</p><p class="hero-description">從古代文明到人類登月，<br>用一點直覺、一點知識，串起世界的故事。</p><div class="start-controls"><label for="filter">這次，想探索什麼？</label><select id="filter">${['全部','中國','亞洲','歐洲','美洲','戰爭','科技'].map(f => `<option ${filter === f ? 'selected' : ''}>${f}</option>`).join('')}</select><button class="primary start">開始遊戲 <span aria-hidden="true">↗</span></button><button class="secondary daily">今日挑戰 <span aria-hidden="true">→</span></button></div><p class="daily-note">每日同一組題目 · 十題挑戰 · 以裝置日期為準</p><div class="hero-facts"><span><b>${events.length}</b> 個歷史時刻</span><span><b>3</b> 次犯錯機會</span><span>最高紀錄 <b>${high.toLocaleString()}</b></span></div></div><div class="hero-art" aria-label="歷史時間軸範例：金字塔、美國獨立宣言、人類登月"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="art-caption">文明的軌跡，等你串起。</span><div class="art-line"></div><article class="sample sample-one"><span class="sample-number">01</span><div><span class="tag">古代文明</span><h3>吉薩大金字塔建成</h3><p>約公元前 2560 年</p></div><svg class="pyramid" viewBox="0 0 120 65" aria-hidden="true"><path d="M5 58 42 7l39 51M42 7l6 51M64 58l25-35 26 35M1 58h118"/></svg></article><div class="sample-insert" aria-hidden="true">＋</div><article class="sample sample-two"><span class="sample-number">02</span><div><span class="tag">新的時代</span><h3>美國獨立宣言</h3><p>1776 年</p></div><span class="sample-symbol" aria-hidden="true">✧</span></article><article class="sample sample-three"><span class="sample-number">03</span><div><span class="tag">探索未知</span><h3>阿波羅十一號登月</h3><p>1969 年</p></div><span class="moon-art" aria-hidden="true"></span></article><span class="art-bottom">過去很遠，歷史很近。</span></div></main><section class="how"><div><span>01</span><p><b>讀一段歷史</b>事件的年份，暫時是個秘密。</p></div><div><span>02</span><p><b>找一個位置</b>點選時間軸上的 ＋，確認答案。</p></div><div><span>03</span><p><b>串起整個世界</b>答對累積連勝，挑戰你的紀錄。</p></div></section><footer>世界史時間線 <span>好奇心，是最好的時光機。</span></footer>`;
  wireHeader();
  document.querySelector('#filter').onchange = e => { filter = e.target.value; };
  document.querySelector('.start').onclick = () => start(false);
  document.querySelector('.daily').onclick = () => start(true);
}
function start(daily) {
  clearTimeout(timer); run++;
  const pool = filterEvents(events, daily ? '全部' : filter);
  const deck = makeDeck(pool, daily ? [] : recent, daily ? seededRandom(`world-history-v1-${dateKey()}`) : Math.random);
  state = { daily, deck, timeline: deck.splice(0,2).sort((a,b) => a.year-b.year), score:0, streak:0, best:0, lives:3, selected:null, answered:0, locked:false, ended:false, current:null };
  app.innerHTML = `${header()}<main class="game enter"><section class="game-top"><div><p class="eyebrow">${daily ? `每日挑戰 / ${dateKey()}` : `自由探索 / ${filter}`}</p><h1>把歷史事件放到正確的年代</h1></div><button class="text-button exit">結束本局</button></section><section class="hud" aria-label="遊戲狀態"><div><span>本局分數</span><strong id="score">0</strong></div><div><span>目前連勝</span><strong id="streak">0 <small>題</small></strong></div><div class="best-stat"><span>最高連勝</span><strong id="best">0 <small>題</small></strong></div><div class="life-stat"><span>剩餘生命</span><strong id="hearts" aria-label="剩餘 3 顆心"><i>♥</i><i>♥</i><i>♥</i></strong></div></section><section class="question-section"><div class="question-intro"><p class="eyebrow">下一個歷史時刻</p><h2>它，發生在什麼時候？</h2><p>讀完事件，選擇時間軸上的插入位置。<br>確認前，你可以隨時改變主意。</p><span id="progress"></span></div><article id="question" class="question-card" tabindex="-1"></article></section><div class="answer-bar"><p id="selection" role="status">點選下方的 ＋ 選擇位置</p><button class="primary confirm" disabled>確認位置 <span aria-hidden="true">↓</span></button></div><div id="feedback" role="status" aria-live="polite" aria-atomic="true"></div><section class="timeline-section" aria-label="歷史時間軸"><div class="timeline-heading"><h2>你的時間線 <span id="timeline-count"></span></h2><span>從遠古，走向現在 <span aria-hidden="true">→</span></span></div><div class="timeline-scroll"><div id="timeline" class="timeline"></div></div><p class="timeline-tip">點選 ＋ 插入事件 · 同年事件可放在彼此前後 · <span class="desktop-tip">左右滑動探索時間線</span><span class="mobile-tip">向下探索時間線</span></p></section></main><footer>世界史時間線 <span>每答一題，多認識一點世界。</span></footer>`;
  wireHeader();
  document.querySelector('.exit').onclick = showExit;
  document.querySelector('.confirm').onclick = answer;
  renderTimeline(); next();
}
function next() {
  if (state.lives === 0 || !state.deck.length || (state.daily && state.answered === 10)) return gameOver();
  state.current = state.deck.shift(); state.selected = null; state.locked = false;
  recent = [...recent, state.current.id, ...state.timeline.slice(0,2).map(e => e.id)].slice(-35); save('wt-recent', recent);
  const e = state.current;
  const card = document.querySelector('#question');
  card.className = 'question-card card-enter';
  card.innerHTML = `<div class="card-top"><span class="tag">${e.region} · ${e.category}</span><span class="unknown-label">等待你定位</span></div><h2>${e.title}</h2><p>${e.description}</p><div class="hidden-year"><span>歷史的哪一刻？</span><b>？<span>？</span>？</b></div>`;
  document.querySelector('#progress').textContent = state.daily ? `第 ${state.answered + 1} / 10 題` : `第 ${state.answered + 1} 題 · 本局題目不重複`;
  document.querySelector('#feedback').innerHTML = '';
  document.querySelector('#selection').textContent = '點選下方的 ＋ 選擇位置';
  document.querySelector('.confirm').disabled = true;
  document.querySelector('.confirm').textContent = '確認位置 ↓';
  document.querySelectorAll('.insert').forEach(button => { button.disabled = false; button.classList.remove('chosen','wrong'); button.setAttribute('aria-pressed','false'); });
  document.querySelectorAll('.timeline-card').forEach(c => c.classList.remove('placed','correct','incorrect'));
  card.focus({preventScroll:true});
  if (state.answered > 0) card.scrollIntoView({behavior:reduced() ? 'instant':'smooth',block:'center'});
}
function renderTimeline(newId, correct) {
  const list = document.querySelector('#timeline');
  const positions = new Map([...list.querySelectorAll('.timeline-card')].map(el => [el.dataset.id, el.getBoundingClientRect()]));
  list.innerHTML = state.timeline.map((e,i) => `${zone(i)}<article class="timeline-card ${e.id === newId ? `placed ${correct ? 'correct':'incorrect'}` : ''}" data-id="${e.id}"><span class="timeline-node"></span><span class="timeline-year">${formatYear(e.year)}</span><span class="tag">${e.region} · ${e.category}</span><h3>${e.title}</h3><p>${e.description}</p>${e.id === newId ? `<span class="placement-label">${correct ? '✓ 位置正確' : '↳ 正確位置'}</span>` : ''}</article>`).join('') + zone(state.timeline.length);
  document.querySelector('#timeline-count').textContent = `${state.timeline.length} 個時刻`;
  list.querySelectorAll('.insert').forEach(btn => btn.onclick = () => choose(Number(btn.dataset.index)));
  if (!reduced()) list.querySelectorAll('.timeline-card').forEach(el => { const before = positions.get(el.dataset.id); if (before) { const after = el.getBoundingClientRect(); el.animate([{transform:`translate(${before.x-after.x}px,${before.y-after.y}px)`},{transform:'translate(0,0)'}], {duration:380,easing:'cubic-bezier(.2,.8,.2,1)'}); } });
}
function zone(index) {
  return `<button class="insert" data-index="${index}" ${state.locked ? 'disabled' : ''} aria-pressed="false" aria-label="${index === 0 ? '放在最早的事件之前' : index === state.timeline.length ? '放在最後的事件之後' : `放在${state.timeline[index-1].title}與${state.timeline[index].title}之間`}"><span aria-hidden="true">＋</span><small>放在這裡</small></button>`;
}
function choose(index) {
  if (state.locked) return;
  state.selected = index;
  document.querySelectorAll('.insert').forEach(btn => { const chosen = Number(btn.dataset.index) === index; btn.classList.toggle('chosen',chosen); btn.setAttribute('aria-pressed',String(chosen)); });
  const before = state.timeline[index-1]; const after = state.timeline[index];
  document.querySelector('#selection').textContent = before && after ? `放在「${before.title}」與「${after.title}」之間` : before ? `放在「${before.title}」之後` : `放在「${after.title}」之前`;
  document.querySelector('.confirm').disabled = false;
}
async function answer() {
  if (state.locked || state.selected === null) return;
  state.locked = true; const generation = run;
  const event = state.current;
  const correct = isCorrectPosition(state.timeline,event.year,state.selected);
  const index = correct ? state.selected : correctIndex(state.timeline,event.year);
  const source = document.querySelector('#question').getBoundingClientRect();
  document.querySelector('.confirm').disabled = true;
  document.querySelectorAll('.insert').forEach(b => b.disabled = true);
  document.querySelector('#question').classList.add(correct ? 'answer-correct' : 'shake');
  if (!correct) document.querySelector('.insert.chosen')?.classList.add('wrong');
  const awarded = correct ? pointsFor(++state.streak) : 0;
  if (correct) { state.score += awarded; state.best = Math.max(state.best,state.streak); } else { state.lives--; state.streak = 0; }
  state.answered++;
  high = Math.max(high,state.score); save('wt-high',high);
  document.querySelector('#score').textContent = state.score.toLocaleString();
  if (correct && !reduced()) document.querySelector('#score').animate([{transform:'scale(1.15)',color:'var(--green)'},{transform:'scale(1)'}],{duration:300});
  document.querySelector('#streak').innerHTML = `${state.streak} <small>題</small>`;
  document.querySelector('#best').innerHTML = `${state.best} <small>題</small>`;
  document.querySelector('#hearts').setAttribute('aria-label',`剩餘 ${state.lives} 顆心`);
  [...document.querySelectorAll('#hearts i')].forEach((heart,i) => { if (i >= state.lives) heart.classList.add('lost'); });
  document.querySelector('.hidden-year').innerHTML = `<span>揭曉年代</span><strong>${formatYear(event.year)}</strong>`;
  document.querySelector('.unknown-label').textContent = '歷史已有答案';
  document.querySelector('#feedback').innerHTML = `<div class="feedback ${correct ? 'success':'error'}"><span class="feedback-icon">${correct ? '✓':'✕'}</span><div><strong>${correct ? '答對了！':'答錯了，再記住一段歷史。'}</strong><p>${correct ? `${formatYear(event.year)} · ${state.streak > 1 ? `連續答對 ${state.streak} 題！` : '每段歷史，都找到了自己的位置。'}` : `正確年份：${formatYear(event.year)}。時間軸已標示正確位置。`}</p></div>${correct ? `<b class="floating">+${awarded}</b>` : ''}<button class="text-button continue" disabled>${state.lives === 0 || (state.daily && state.answered === 10) || !state.deck.length ? '查看成績' : '下一題 →'}</button></div>`;
  document.querySelector('#selection').textContent = correct ? '定位成功，讓時間線再長一點。' : '已揭曉年份，看看它真正屬於哪個時代。';
  await sleep(reduced() ? 0 : 350);
  if (generation !== run) return;
  state.timeline.splice(index,0,event); renderTimeline(event.id,correct);
  const target = document.querySelector(`[data-id="${event.id}"]`);
  target.scrollIntoView({behavior:reduced() ? 'instant':'smooth',block:'nearest',inline:'center'});
  await sleep(reduced() ? 0 : 350);
  if (generation !== run) return;
  if (!reduced()) {
    const rect = target.getBoundingClientRect();
    target.animate([{opacity:0,transform:`translate(${Math.max(-700, Math.min(700,source.x-rect.x))}px,${Math.max(-500,Math.min(500,source.y-rect.y))}px) scale(.9)`},{opacity:1,transform:'translate(0,0) scale(1.03)',offset:.82},{opacity:1,transform:'translate(0,0) scale(1)'}],{duration:550,easing:'cubic-bezier(.2,.7,.2,1)'});
  }
  await sleep(reduced() ? 0 : 550);
  if (generation !== run) return;
  const proceed = () => { clearTimeout(timer); next(); };
  const button = document.querySelector('.continue'); button.disabled = false; button.onclick = proceed;
  if (correct && !document.querySelector('dialog')) timer = setTimeout(proceed, 1800);
  else button.focus({preventScroll:true});
}
function modal(content, label) {
  const dialog = document.createElement('dialog'); dialog.className = 'modal'; dialog.setAttribute('aria-label',label); dialog.innerHTML = content; app.append(dialog); dialog.showModal();
  return dialog;
}
function showExit() {
  if (document.querySelector('dialog')) return;
  const dialog = modal('<p class="eyebrow">暫停片刻</p><h2>要結束這趟旅程嗎？</h2><p>最高分已自動保留。本局進度不會儲存。</p><div class="modal-actions"><button class="primary resume">繼續遊戲</button><button class="secondary leave">返回首頁</button></div>', '結束本局');
  clearTimeout(timer);
  dialog.querySelector('.resume').onclick = () => { dialog.close(); dialog.remove(); };
  dialog.querySelector('.leave').onclick = () => { dialog.close(); landing(); };
  dialog.addEventListener('close',() => dialog.remove());
}
function gameOver() {
  clearTimeout(timer); state.ended = true;
  const success = state.lives > 0;
  const dialog = modal(`<div class="result-emblem" aria-hidden="true">${success ? '✧':'⌛'}</div><p class="eyebrow">${state.daily ? '今日挑戰' : '這一趟歷史旅程'}</p><h2>${success ? '時間線，完成了。':'歷史，等你再挑戰。'}</h2><p>你為 ${state.timeline.length} 個歷史時刻找到了位置。</p><span class="result-label">本局最終分數</span><strong class="result-score">0</strong><div class="result-stats"><div><span>歷史最高分</span><b>${high.toLocaleString()}</b></div><div><span>本局最長連勝</span><b>${state.best} 題</b></div></div><div class="modal-actions"><button class="primary restart">再玩一次 ↗</button><button class="secondary share">分享本局成績</button><button class="text-button home">返回首頁</button></div><p class="share-status" role="status"></p>`, '本局成績');
  dialog.addEventListener('cancel',e => { e.preventDefault(); });
  const score = state.score; const begin = performance.now(); const el = dialog.querySelector('.result-score');
  function count(now) { const t = reduced() ? 1 : Math.min(1,(now-begin)/700); el.textContent = Math.round(score*(1-(1-t)**3)).toLocaleString(); if (t < 1 && el.isConnected) requestAnimationFrame(count); }
  requestAnimationFrame(count);
  dialog.querySelector('.restart').onclick = () => { const daily = state.daily; dialog.close(); start(daily); };
  dialog.querySelector('.home').onclick = () => { dialog.close(); landing(); };
  dialog.querySelector('.share').onclick = async () => {
    const text = `我在「世界史時間線」${state.daily ? `每日挑戰（${dateKey()}）` : ''}獲得 ${state.score} 分，最長連勝 ${state.best} 題！來挑戰歷史的先後順序：https://onuty.github.io/WikiTrivia/`;
    try { if (navigator.share) await navigator.share({title:'世界史時間線',text}); else { await navigator.clipboard.writeText(text); dialog.querySelector('.share-status').textContent = '成績已複製，可以貼給朋友了。'; } } catch (error) { if (error.name !== 'AbortError') { dialog.querySelector('.share-status').textContent = text; } }
  };
}
landing();

