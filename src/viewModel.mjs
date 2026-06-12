/**
 * Format a byte count into a compact MB label.
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb >= 10 ? 1 : 2)} MB`;
}

/**
 * Derive a deterministic placeholder size for mock file entries.
 * @param {{ size?: number }} file
 * @param {number} index
 * @returns {number}
 */
function pseudoSize(file, index) {
  const seed = file.size || (index + 1) * 7340032;
  return Math.max(seed, 2_800_000 + index * 550_000);
}

/**
 * Normalize incoming file objects into view-model file entries.
 * @param {ArrayLike<{name: string, size?: number, type?: string}>} files
 * @returns {Array<{id: string, name: string, size: number, status: string, original: unknown}>}
 */
function buildFiles(files) {
  return Array.from(files).map((file, index) => ({
    id: `${file.name}-${file.size}-${index}`,
    name: file.name.replace(/\.pdf$/i, ''),
    size: pseudoSize(file, index),
    status: 'Ready',
    original: file,
  }));
}

/**
 * Return the metadata for a compression preset.
 * @param {'fast' | 'balanced' | 'high' | 'custom'} mode
 * @returns {{label: string, factor: number, hint: string}}
 */
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

/**
 * Create the compression feature ViewModel.
 *
 * @param {{
 *   setIntervalFn?: typeof setInterval,
 *   clearIntervalFn?: typeof clearInterval,
 * }} [options]
 * @returns {{
 *   subscribe: (listener: (state: ReturnType<ReturnType<typeof createCompressionViewModel>['subscribe']>) => void) => () => boolean,
 *   addFiles: (fileListInput: ArrayLike<{name: string, size?: number, type?: string}>) => void,
 *   removeFile: (id: string) => void,
 *   clearFiles: () => void,
 *   setMode: (mode: 'fast' | 'balanced' | 'high' | 'custom') => void,
 *   updateCustom: (partial: { imageCompression?: number, resolution?: number, targetSize?: number }) => void,
 *   togglePreview: () => void,
 *   compress: () => void,
 *   exportResult: () => { type: 'zip' | 'pdf', label: string } | null,
 * }}
 */
export function createCompressionViewModel(options = {}) {
  const setIntervalFn = options.setIntervalFn ?? (globalThis.window?.setInterval ?? globalThis.setInterval);
  const clearIntervalFn = options.clearIntervalFn ?? (globalThis.window?.clearInterval ?? globalThis.clearInterval);
  let timer = null;
  const listeners = new Set();

  const state = {
    files: [],
    mode: 'balanced',
    isProcessing: false,
    progress: 0,
    result: null,
    custom: {
      imageCompression: 70,
      resolution: 150,
      targetSize: 50,
    },
    ui: {
      previewOpen: false,
    },
  };

  function emit() {
    listeners.forEach((listener) => listener(getState()));
  }

  function getState() {
    const total = state.files.reduce((sum, file) => sum + file.size, 0);
    const current = state.isProcessing
      ? Math.min(state.files.length, Math.max(1, Math.ceil((state.progress / 100) * state.files.length)))
      : 0;
    return {
      files: state.files.map((file, index) => ({
        ...file,
        displayStatus: state.isProcessing
          ? state.progress >= ((index + 1) / state.files.length) * 100
            ? 'Done'
            : state.progress > (index / state.files.length) * 100
              ? 'Processing'
              : 'Queued'
          : file.status,
      })),
      mode: state.mode,
      isProcessing: state.isProcessing,
      progress: state.progress,
      custom: { ...state.custom },
      ui: { ...state.ui },
      summary: {
        count: state.files.length,
        totalSize: total,
        totalSizeLabel: formatBytes(total),
        beforeSizeLabel: formatBytes(total),
        afterSizeLabel: state.result ? formatBytes(state.result.after) : '0 MB',
      },
      result: state.result,
      status: {
        top:
          state.isProcessing
            ? 'Processing locally'
            : state.result
              ? 'Ready to export'
              : 'Local processing only',
        text:
          state.isProcessing
            ? `Compressing file ${current} of ${state.files.length}.`
            : state.result
              ? 'Compression finished successfully.'
              : state.files.length
                ? `${state.files.length} file${state.files.length === 1 ? '' : 's'} ready for compression.`
                : 'Waiting for files.',
        batch:
          state.isProcessing
            ? `${current}/${state.files.length} files processed`
            : state.result
              ? `${state.result.count} file${state.result.count === 1 ? '' : 's'} ready`
              : state.files.length
                ? 'Ready to compress'
                : 'No batch running',
        eta:
          state.isProcessing
            ? 'Working...'
            : state.result
              ? 'Export available'
              : state.files.length
                ? 'Choose a preset and compress'
                : 'Ready',
      },
      canCompress: state.files.length > 0 && !state.isProcessing,
      canClear: state.files.length > 0 && !state.isProcessing,
      canExport: Boolean(state.result),
      preset: getPresetCopy(state.mode),
      modeOptions: ['fast', 'balanced', 'high', 'custom'],
    };
  }

  function notify() {
    emit();
  }

  function addFiles(fileListInput) {
    const incoming = buildFiles(Array.from(fileListInput).filter((file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name)));
    if (incoming.length === 0) return;
    state.files = [...state.files, ...incoming];
    state.result = null;
    state.progress = 0;
    notify();
  }

  function removeFile(id) {
    if (state.isProcessing) return;
    state.files = state.files.filter((file) => file.id !== id);
    state.result = null;
    if (state.files.length === 0) {
      state.progress = 0;
    }
    notify();
  }

  function clearFiles() {
    if (state.isProcessing) return;
    state.files = [];
    state.result = null;
    state.progress = 0;
    notify();
  }

  function setMode(mode) {
    state.mode = mode;
    state.result = null;
    if (!state.isProcessing) {
      state.progress = 0;
    }
    notify();
  }

  function updateCustom(partial) {
    state.mode = 'custom';
    state.custom = {
      ...state.custom,
      ...partial,
    };
    state.result = null;
    if (!state.isProcessing) {
      state.progress = 0;
    }
    notify();
  }

  function togglePreview() {
    state.ui.previewOpen = !state.ui.previewOpen;
    notify();
  }

  function compress() {
    if (state.files.length === 0 || state.isProcessing) return;

    state.isProcessing = true;
    state.progress = 0;
    state.result = null;
    notify();

    const total = state.files.reduce((sum, file) => sum + file.size, 0);
    const preset = getPresetCopy(state.mode);
    const factor = preset.factor;
    const customBoost = state.mode === 'custom'
      ? Math.max(0.48, 1 - (state.custom.imageCompression / 220) - (state.custom.resolution / 1200) - (state.custom.targetSize / 600))
      : 1;
    const output = Math.round(total * factor * customBoost);

    let progress = 0;
    timer = setIntervalFn(() => {
      progress += state.files.length > 1 ? 7 : 10;
      state.progress = Math.min(100, progress);
      notify();

      if (state.progress >= 100) {
        clearIntervalFn(timer);
        timer = null;
        state.isProcessing = false;
        state.result = {
          count: state.files.length,
          before: total,
          after: Math.max(1_200_000, output),
        };
        state.files = state.files.map((file) => ({ ...file, status: 'Done' }));
        state.progress = 100;
        notify();
      }
    }, 180);
  }

  function exportResult() {
    if (!state.result) return null;
    return {
      type: state.result.count > 1 ? 'zip' : 'pdf',
      label: state.result.count > 1 ? 'ZIP export ready' : 'PDF export ready',
    };
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(getState());
    return () => listeners.delete(listener);
  }

  return {
    subscribe,
    addFiles,
    removeFile,
    clearFiles,
    setMode,
    updateCustom,
    togglePreview,
    compress,
    exportResult,
  };
}
