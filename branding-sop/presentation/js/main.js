/* ---------- restore ---------- */
render();
(async () => {
  for (const k of IMG_KEYS) state[k] = await dbGet(k);
  state.name = (lsGet('ctrader-preview-name') || '').slice(0, 30);   // the stores allow 30 characters
  state.sq = lsGet('ctrader-preview-sq') === '1';
  nameInput.value = state.name;
  render();
})();
