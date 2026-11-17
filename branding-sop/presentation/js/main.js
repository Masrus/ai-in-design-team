/* ---------- restore ---------- */
render();
(async () => {
  for (const k of IMG_KEYS) state[k] = await dbGet(k);
  state.name = lsGet('ctrader-preview-name') || '';
  state.sq = lsGet('ctrader-preview-sq') === '1';
  nameInput.value = state.name;
  render();
})();
