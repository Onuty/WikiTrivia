export function formatYear(year) {
  if (!Number.isInteger(year) || year === 0) throw new RangeError('年份必須為非零整數');
  return year < 0 ? `公元前 ${-year} 年` : year < 1000 ? `公元 ${year} 年` : `${year} 年`;
}
export function isCorrectPosition(timeline, year, index) {
  if (!Number.isInteger(index) || index < 0 || index > timeline.length) return false;
  return (index === 0 || timeline[index - 1].year <= year) && (index === timeline.length || year <= timeline[index].year);
}
export function correctIndex(timeline, year) {
  const index = timeline.findIndex(event => event.year > year);
  return index < 0 ? timeline.length : index;
}
export function shuffled(events, random = Math.random) {
  const copy = [...events];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
export function seededRandom(seed) {
  let n = 2166136261;
  for (const char of seed) n = Math.imul(n ^ char.charCodeAt(0), 16777619);
  return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function pointsFor(streak) { return 100 + (streak - 1) * 20; }
export function filterEvents(events, filter) {
  if (filter === '全部') return events;
  if (['戰爭','科技'].includes(filter)) return events.filter(e => e.category === filter || (filter === '科技' && e.category === '太空'));
  if (filter === '亞洲') return events.filter(e => ['中國','日本','韓國','東南亞','印度','中東','蒙古'].includes(e.region));
  if (filter === '美洲') return events.filter(e => ['美洲','美國','拉丁美洲'].includes(e.region));
  return events.filter(e => e.region === filter);
}
export function makeDeck(events, recent = [], random = Math.random) {
  const recentSet = new Set(recent);
  return [...shuffled(events.filter(e => !recentSet.has(e.id)), random), ...shuffled(events.filter(e => recentSet.has(e.id)), random)];
}
