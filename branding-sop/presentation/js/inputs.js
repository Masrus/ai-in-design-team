/* ---------- inputs: logo uploads, clear, broker name, reset ---------- */
for (const key of ['light', 'dark']) {
  document.getElementById('edit-' + key).addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openCrop(key); });
}
document.querySelectorAll('.drop input[type=file]').forEach((inp) => {
  inp.addEventListener('change', () => { setLogo(inp.dataset.key, inp.files[0]); inp.value = ''; });
  const drop = inp.closest('.drop');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); setLogo(inp.dataset.key, e.dataTransfer.files[0]); });
});
for (const key of ['light', 'dark']) {
  document.getElementById('clear-' + key).addEventListener('click', async (e) => {
    e.preventDefault(); e.stopPropagation();
    for (const k of LOGO_KEYS(key)) { state[k] = null; await dbSet(k, null); }
    render();
  });
}
const nameInput = document.getElementById('name');
nameInput.addEventListener('input', () => { state.name = nameInput.value; lsSet('ctrader-preview-name', state.name); render(); });
document.getElementById('clear-name').addEventListener('click', () => {
  state.name = ''; nameInput.value = ''; lsSet('ctrader-preview-name', ''); render(); nameInput.focus();
});
document.getElementById('reset').addEventListener('click', async () => {
  for (const k of IMG_KEYS) { state[k] = null; await dbSet(k, null); }
  state.name = ''; nameInput.value = ''; lsSet('ctrader-preview-name', '');
  state.sq = false; lsSet('ctrader-preview-sq', '');
  render();
});
