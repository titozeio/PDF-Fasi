let vm = null;
const vmReady = import('./viewModel.mjs').then(({ createCompressionViewModel }) => {
  vm = createCompressionViewModel();
  vm.subscribe(render);
  return vm;
});

const refs = {
  fileInput: document.getElementById('file-input'),
  browseBtn: document.getElementById('browse-btn'),
  clearBtn: document.getElementById('clear-btn'),
  dropzone: document.getElementById('dropzone'),
  fileList: document.getElementById('file-list'),
  fileCount: document.getElementById('file-count'),
  totalSize: document.getElementById('total-size'),
  compressBtn: document.getElementById('compress-btn'),
  previewBtn: document.getElementById('preview-btn'),
  exportBtn: document.getElementById('export-btn'),
  statusText: document.getElementById('status-text'),
  progressFill: document.getElementById('progress-fill'),
  progressLabel: document.getElementById('progress-label'),
  batchMeta: document.getElementById('batch-meta'),
  etaMeta: document.getElementById('eta-meta'),
  resultCopy: document.getElementById('result-copy'),
  beforeSize: document.getElementById('before-size'),
  afterSize: document.getElementById('after-size'),
  topStatus: document.getElementById('top-status'),
  customPanel: document.getElementById('custom-panel'),
  modeButtons: Array.from(document.querySelectorAll('.mode-chip')),
  presetCards: Array.from(document.querySelectorAll('.preset-card')),
  imageRange: document.getElementById('image-range'),
  resolutionRange: document.getElementById('resolution-range'),
  sizeRange: document.getElementById('size-range'),
  imageValue: document.getElementById('image-value'),
  resolutionValue: document.getElementById('resolution-value'),
  sizeValue: document.getElementById('size-value'),
};

function render(state) {
  refs.fileCount.textContent = String(state.summary.count);
  refs.totalSize.textContent = state.summary.totalSizeLabel;
  refs.beforeSize.textContent = state.summary.beforeSizeLabel;
  refs.afterSize.textContent = state.summary.afterSizeLabel;
  refs.statusText.textContent = state.status.text;
  refs.batchMeta.textContent = state.status.batch;
  refs.etaMeta.textContent = state.status.eta;
  refs.topStatus.textContent = state.status.top;
  refs.progressFill.style.width = `${state.progress}%`;
  refs.progressLabel.textContent = `${Math.round(state.progress)}%`;
  refs.exportBtn.disabled = !state.canExport;
  refs.compressBtn.disabled = !state.canCompress;
  refs.clearBtn.disabled = !state.canClear;
  refs.previewBtn.disabled = false;
  refs.customPanel.classList.toggle('hidden', state.mode !== 'custom');
  refs.resultCopy.textContent = state.result
    ? `Compression complete. ${state.result.count > 1 ? 'ZIP export ready.' : 'PDF export ready.'}`
    : 'Compressed files will appear here after processing.';
  refs.imageValue.textContent = `${state.custom.imageCompression}%`;
  refs.resolutionValue.textContent = `${state.custom.resolution} dpi`;
  refs.sizeValue.textContent = `${state.custom.targetSize}%`;

  refs.modeButtons.forEach((button) => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  refs.presetCards.forEach((card) => {
    card.classList.toggle('active', card.dataset.mode === state.mode);
  });

  if (state.files.length === 0) {
    refs.fileList.innerHTML = `
      <div class="empty-state">
        <h3>No PDFs loaded yet</h3>
        <p>Your selection will appear here with file size, status, and remove actions.</p>
      </div>
    `;
    return;
  }

  refs.fileList.innerHTML = state.files
    .map(
      (file) => `
        <article class="file-row">
          <div class="file-main">
            <div class="file-name">${file.name}.pdf</div>
            <div class="file-meta">${formatBytes(file.size)} original size</div>
          </div>
          <div class="file-status">${file.displayStatus}</div>
          <button class="icon-btn" type="button" data-remove="${file.id}" aria-label="Remove ${file.name}.pdf">x</button>
        </article>
      `,
    )
    .join('');

  refs.fileList.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => vm.removeFile(button.getAttribute('data-remove')));
  });
}

function formatBytes(bytes) {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb >= 10 ? 1 : 2)} MB`;
}

refs.browseBtn.addEventListener('click', () => refs.fileInput.click());
refs.fileInput.addEventListener('change', (event) => {
  if (!vm) return;
  vm.addFiles(event.target.files);
  event.target.value = '';
});

refs.dropzone.addEventListener('click', () => refs.fileInput.click());
refs.dropzone.addEventListener('dragover', (event) => {
  event.preventDefault();
  refs.dropzone.classList.add('dragover');
});
refs.dropzone.addEventListener('dragleave', () => refs.dropzone.classList.remove('dragover'));
refs.dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  refs.dropzone.classList.remove('dragover');
  if (!vm) return;
  vm.addFiles(event.dataTransfer.files);
});

refs.clearBtn.addEventListener('click', () => vm?.clearFiles());
refs.compressBtn.addEventListener('click', () => vm?.compress());
refs.previewBtn.addEventListener('click', () => vm?.togglePreview());
refs.exportBtn.addEventListener('click', () => vm?.exportResult());

refs.modeButtons.forEach((button) => {
  button.addEventListener('click', () => vm?.setMode(button.dataset.mode));
});

refs.presetCards.forEach((card) => {
  card.addEventListener('click', () => vm?.setMode(card.dataset.mode));
});

[refs.imageRange, refs.resolutionRange, refs.sizeRange].forEach((input) => {
  input.addEventListener('input', () => {
    vm?.updateCustom({
      imageCompression: Number(refs.imageRange.value),
      resolution: Number(refs.resolutionRange.value),
      targetSize: Number(refs.sizeRange.value),
    });
  });
});
