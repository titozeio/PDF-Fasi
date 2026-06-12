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

const PRESETS = {
  print: { label: 'Print', factor: 0.92, hint: 'Lower compression, higher quality' },
  ebook: { label: 'Ebook', factor: 0.8, hint: 'Balanced compression' },
  screen: { label: 'Screen', factor: 0.68, hint: 'Higher compression, smaller output' },
  custom: { label: 'Custom', factor: 0.6, hint: 'Advanced tuning' },
};

/**
 * Return the metadata for a compression preset.
 * @param {'fast' | 'balanced' | 'high' | 'custom'} mode
 * @returns {{label: string, factor: number, hint: string}}
 */
function getPresetCopy(mode) {
  return PRESETS[mode] ?? PRESETS.balanced;
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
 *   setMode: (mode: 'print' | 'ebook' | 'screen' | 'custom') => void,
 *   updateCustom: (partial: { jpegQuality?: number, maxImageResolution?: number | 'keep-original', convertToGrayscale?: boolean }) => void,
 *   setPageScaleFactor: (value: number | string) => void,
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
    mode: 'ebook',
    isProcessing: false,
    progress: 0,
    result: null,
    custom: {
      jpegQuality: 75,
      maxImageResolution: 150,
      convertToGrayscale: false,
      pageScaleFactor: 100,
      pageScaleFactorLastValid: 100,
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
      presetOptions: Object.entries(PRESETS).map(([mode, preset]) => ({
        mode,
        ...preset,
      })),
    };
  }

  function notify() {
    emit();
  }

  /**
   * Add PDF files to the current selection.
   * @param {ArrayLike<{name: string, size?: number, type?: string}>} fileListInput
   */
  function addFiles(fileListInput) {
    const incoming = buildFiles(Array.from(fileListInput).filter((file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name)));
    if (incoming.length === 0) return;
    state.files = [...state.files, ...incoming];
    state.result = null;
    state.progress = 0;
    notify();
  }

  /**
   * Remove one file from the current selection.
   * @param {string} id
   */
  function removeFile(id) {
    if (state.isProcessing) return;
    state.files = state.files.filter((file) => file.id !== id);
    state.result = null;
    if (state.files.length === 0) {
      state.progress = 0;
    }
    notify();
  }

  /**
   * Clear the current file selection.
   */
  function clearFiles() {
    if (state.isProcessing) return;
    state.files = [];
    state.result = null;
    state.progress = 0;
    notify();
  }

  /**
   * Select a compression preset or custom mode.
   * @param {'print' | 'ebook' | 'screen' | 'custom'} mode
   */
  function setMode(mode) {
    state.mode = mode;
    state.result = null;
    if (!state.isProcessing) {
      state.progress = 0;
    }
    notify();
  }

  /**
   * Update the custom compression parameters.
   * @param {{ jpegQuality?: number, maxImageResolution?: number | 'keep-original', convertToGrayscale?: boolean }} partial
   */
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

  /**
   * Update the custom page scale factor with clamping and invalid-input recovery.
   * @param {number | string} value
   */
  function setPageScaleFactor(value) {
    const raw = typeof value === 'string' ? value.trim() : value;
    const parsed = raw === '' ? Number.NaN : (typeof raw === 'number' ? raw : Number(raw));
    const previous = state.custom.pageScaleFactorLastValid;
    const next = Number.isFinite(parsed) ? Math.min(200, Math.max(10, Math.round(parsed / 5) * 5)) : previous;
    state.mode = 'custom';
    state.custom = {
      ...state.custom,
      pageScaleFactor: next,
      pageScaleFactorLastValid: next,
    };
    state.result = null;
    if (!state.isProcessing) {
      state.progress = 0;
    }
    notify();
  }

  /**
   * Toggle the lightweight preview state used by the screen shell.
   */
  function togglePreview() {
    state.ui.previewOpen = !state.ui.previewOpen;
    notify();
  }

  /**
   * Start the simulated compression flow for the selected files.
   */
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
      ? Math.max(
        0.45,
        Math.min(
          1.4,
          (state.custom.jpegQuality / 100)
          * (state.custom.maxImageResolution === 'keep-original' ? 1 : Math.max(0.55, Number(state.custom.maxImageResolution) / 300))
          * (state.custom.convertToGrayscale ? 0.9 : 1)
          * Math.max(0.55, Math.min(1.35, state.custom.pageScaleFactor / 100)),
        ),
      )
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

  /**
   * Describe the export artifact for the current compression result.
   * @returns {{ type: 'zip' | 'pdf', label: string } | null}
   */
  function exportResult() {
    if (!state.result) return null;
    return {
      type: state.result.count > 1 ? 'zip' : 'pdf',
      label: state.result.count > 1 ? 'ZIP export ready' : 'PDF export ready',
    };
  }

  /**
   * Subscribe to ViewModel state updates.
   * @param {(state: ReturnType<typeof getState>) => void} listener
   * @returns {() => boolean}
   */
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
    setPageScaleFactor,
    togglePreview,
    compress,
    exportResult,
  };
}
