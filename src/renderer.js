const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const clearBtn = document.getElementById('clear-btn');
const dropzone = document.getElementById('dropzone');
const fileList = document.getElementById('file-list');
const fileCount = document.getElementById('file-count');
const totalSize = document.getElementById('total-size');
const compressBtn = document.getElementById('compress-btn');
const previewBtn = document.getElementById('preview-btn');
const exportBtn = document.getElementById('export-btn');
const statusText = document.getElementById('status-text');
const progressFill = document.getElementById('progress-fill');
const progressLabel = document.getElementById('progress-label');
const batchMeta = document.getElementById('batch-meta');
const etaMeta = document.getElementById('eta-meta');
const resultCopy = document.getElementById('result-copy');
const beforeSize = document.getElementById('before-size');
const afterSize = document.getElementById('after-size');
const topStatus = document.getElementById('top-status');
const customPanel = document.getElementById('custom-panel');
const modeButtons = Array.from(document.querySelectorAll('.mode-chip'));
const presetCards = Array.from(document.querySelectorAll('.preset-card'));
const imageRange = document.getElementById('image-range');
const resolutionRange = document.getElementById('resolution-range');
const sizeRange = document.getElementById('size-range');
const imageValue = document.getElementById('image-value');
const resolutionValue = document.getElementById('resolution-value');
const sizeValue = document.getElementById('size-value');

const state = {
  files: [],
  mode: 'balanced',
  isProcessing: false,
  progress: 0,
  result: null,
  previewOpen: false,
  custom: {
    imageCompression: 70,
    resolution: 150,
    targetSize: 50,
  },
  timer: null,
};

function formatBytes(bytes) {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb >= 10 ? 1 : 2)} MB`;
}

function getPresetCopy(mode) {
  switch (mode) {
    case 'fast':
      return { label: 'Fast', factor: 0.7, hint: 'Speed first' };
    case 'high':
      return { label: 'High Quality', factor: 0.88, hint: 'More detail kept' };
    case 'custom':
      return { label: 'Custom', factor: 0.6, hint: 'Advanced tuning' };
    case 'balanced':
    default:
      return { label: 'Balanced', factor: 0.8, hint: 'Default choice' };
  }
}

function pseudoSize(file, index) {
  const seed = file.size || (index + 1) * 7340032;
  return Math.max(seed, 2_800_000 + index * 550_000);
}

function buildFiles(files) {
  return Array.from(files).map((file, index) => ({
    id: `${file.name}-${file.size}-${index}`,
    name: file.name.replace(/\.pdf$/i, ''),
    size: pseudoSize(file, index),
    status: 'Ready',
    original: file,
  }));
}

function updateStats() {
  const total = state.files.reduce((sum, file) => sum + file.size, 0);
  fileCount.textContent = String(state.files.length);
  totalSize.textContent = formatBytes(total);
  beforeSize.textContent = formatBytes(total);
}

function renderFileList() {
  if (state.files.length === 0) {
    fileList.innerHTML = `
      <div class="empty-state">
        <h3>No PDFs loaded yet</h3>
        <p>Your selection will appear here with file size, status, and remove actions.</p>
      </div>
    `;
    return;
  }

  fileList.innerHTML = state.files
    .map((file, index) => {
      const fileStatus = state.isProcessing
        ? state.progress >= ((index + 1) / state.files.length) * 100
          ? 'Done'
          : state.progress > (index / state.files.length) * 100
            ? 'Processing'
            : 'Queued'
        : file.status;

      return `
        <article class="file-row">
          <div class="file-main">
            <div class="file-name">${file.name}.pdf</div>
            <div class="file-meta">${formatBytes(file.size)} original size</div>
          </div>
          <div class="file-status">${fileStatus}</div>
          <button class="icon-btn" type="button" data-remove="${file.id}" aria-label="Remove ${file.name}.pdf">x</button>
        </article>
      `;
    })
    .join('');

  fileList.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-remove');
      state.files = state.files.filter((file) => file.id !== id);
      state.result = null;
      render();
    });
  });
}

function updateModeUI() {
  modeButtons.forEach((button) => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  presetCards.forEach((card) => {
    const active = card.dataset.mode === state.mode;
    card.classList.toggle('active', active);
  });

  customPanel.classList.toggle('hidden', state.mode !== 'custom');
}

function updateCustomValues() {
  imageValue.textContent = `${state.custom.imageCompression}%`;
  resolutionValue.textContent = `${state.custom.resolution} dpi`;
  sizeValue.textContent = `${state.custom.targetSize}%`;
}

function updateProgress() {
  progressFill.style.width = `${state.progress}%`;
  progressLabel.textContent = `${Math.round(state.progress)}%`;
}

function updateResult() {
  if (!state.result) {
    resultCopy.textContent = 'Compressed files will appear here after processing.';
    afterSize.textContent = '0 MB';
    exportBtn.disabled = true;
    return;
  }

  const suffix = state.result.count > 1 ? 'ZIP export ready' : 'PDF export ready';
  resultCopy.textContent = `Compression complete. ${suffix}.`;
  afterSize.textContent = formatBytes(state.result.after);
  exportBtn.disabled = false;
}

function updateStatusMessage() {
  if (state.isProcessing) {
    const current = Math.min(state.files.length, Math.max(1, Math.ceil((state.progress / 100) * state.files.length)));
    statusText.textContent = `Compressing file ${current} of ${state.files.length}.`;
    batchMeta.textContent = `${current}/${state.files.length} files processed`;
    etaMeta.textContent = 'Working...';
    topStatus.textContent = 'Processing locally';
    return;
  }

  if (state.result) {
    statusText.textContent = 'Compression finished successfully.';
    batchMeta.textContent = `${state.result.count} file${state.result.count === 1 ? '' : 's'} ready`;
    etaMeta.textContent = 'Export available';
    topStatus.textContent = 'Ready to export';
    return;
  }

  statusText.textContent = state.files.length
    ? `${state.files.length} file${state.files.length === 1 ? '' : 's'} ready for compression.`
    : 'Waiting for files.';
  batchMeta.textContent = state.files.length ? 'Ready to compress' : 'No batch running';
  etaMeta.textContent = state.files.length ? 'Choose a preset and compress' : 'Ready';
  topStatus.textContent = 'Local processing only';
}

function render() {
  updateStats();
  renderFileList();
  updateModeUI();
  updateCustomValues();
  updateProgress();
  updateResult();
  updateStatusMessage();
  compressBtn.disabled = state.files.length === 0 || state.isProcessing;
  previewBtn.disabled = state.isProcessing;
  clearBtn.disabled = state.files.length === 0 || state.isProcessing;
}

function addFiles(fileListInput) {
  const incoming = buildFiles(Array.from(fileListInput).filter((file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name)));
  if (incoming.length === 0) return;
  state.files = [...state.files, ...incoming];
  state.result = null;
  state.progress = 0;
  render();
}

function setMode(mode) {
  state.mode = mode;
  state.result = null;
  if (!state.isProcessing) {
    state.progress = 0;
  }
  render();
}

function simulateCompression() {
  if (state.files.length === 0 || state.isProcessing) return;

  state.isProcessing = true;
  state.progress = 0;
  state.result = null;
  render();

  const total = state.files.reduce((sum, file) => sum + file.size, 0);
  const preset = getPresetCopy(state.mode);
  const factor = preset.factor;
  const customBoost = state.mode === 'custom'
    ? Math.max(0.48, 1 - (state.custom.imageCompression / 220) - (state.custom.resolution / 1200) - (state.custom.targetSize / 600))
    : 1;
  const output = Math.round(total * factor * customBoost);

  let progress = 0;
  state.timer = window.setInterval(() => {
    progress += state.files.length > 1 ? 7 : 10;
    state.progress = Math.min(100, progress);
    render();

    if (state.progress >= 100) {
      window.clearInterval(state.timer);
      state.timer = null;
      state.isProcessing = false;
      state.result = {
        count: state.files.length,
        before: total,
        after: Math.max(1_200_000, output),
      };
      state.files = state.files.map((file) => ({ ...file, status: 'Done' }));
      state.progress = 100;
      render();
    }
  }, 180);
}

browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (event) => {
  addFiles(event.target.files);
  event.target.value = '';
});

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('dragover');
  addFiles(event.dataTransfer.files);
});

clearBtn.addEventListener('click', () => {
  if (state.isProcessing) return;
  state.files = [];
  state.result = null;
  state.progress = 0;
  render();
});

compressBtn.addEventListener('click', simulateCompression);
previewBtn.addEventListener('click', () => {
  state.previewOpen = !state.previewOpen;
  topStatus.textContent = state.previewOpen ? 'Preview mode enabled' : 'Local processing only';
});

exportBtn.addEventListener('click', () => {
  if (!state.result) return;
  topStatus.textContent = state.result.count > 1 ? 'ZIP export ready' : 'PDF export ready';
});

modeButtons.forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});

presetCards.forEach((card) => {
  card.addEventListener('click', () => setMode(card.dataset.mode));
});

[imageRange, resolutionRange, sizeRange].forEach((input) => {
  input.addEventListener('input', () => {
    state.mode = 'custom';
    state.custom.imageCompression = Number(imageRange.value);
    state.custom.resolution = Number(resolutionRange.value);
    state.custom.targetSize = Number(sizeRange.value);
    state.result = null;
    render();
  });
});

render();
