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
 * @param {'print' | 'ebook' | 'screen' | 'custom'} mode
 * @returns {{label: string, factor: number, hint: string}}
 */
function getPresetCopy(mode) {
  return PRESETS[mode] ?? PRESETS.ebook;
}

/**
 * Map a display label to a file-status variant for the renderer.
 * @param {string} value
 * @returns {'ready' | 'queued' | 'processing' | 'done' | 'error' | 'neutral'}
 */
function getStatusVariant(value) {
  switch (value) {
    case 'Ready':
      return 'ready';
    case 'Queued':
      return 'queued';
    case 'Processing':
      return 'processing';
    case 'Done':
      return 'done';
    case 'Error':
      return 'error';
    default:
      return 'neutral';
  }
}

/**
 * Clamp and normalize a page scale factor input.
 * @param {number | string} value
 * @param {number} fallback
 * @returns {{ value: number, valid: boolean }}
 */
function normalizeScaleFactor(value, fallback) {
  const raw = typeof value === 'string' ? value.trim() : value;
  const parsed = raw === '' ? Number.NaN : (typeof raw === 'number' ? raw : Number(raw));
  if (!Number.isFinite(parsed)) {
    return { value: fallback, valid: false };
  }

  return {
    value: Math.min(200, Math.max(10, Math.round(parsed / 5) * 5)),
    valid: true,
  };
}

/**
 * Encode a string into UTF-8 bytes.
 * @param {string} value
 * @returns {Uint8Array}
 */
function utf8(value) {
  return new TextEncoder().encode(value);
}

/**
 * Concatenate byte chunks into a single Uint8Array.
 * @param {Uint8Array[]} chunks
 * @returns {Uint8Array}
 */
function concatBytes(chunks) {
  const size = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

/**
 * Write a 16-bit little-endian integer into a byte array.
 * @param {number} value
 * @returns {Uint8Array}
 */
function u16(value) {
  const view = new Uint8Array(2);
  const data = new DataView(view.buffer);
  data.setUint16(0, value, true);
  return view;
}

/**
 * Write a 32-bit little-endian integer into a byte array.
 * @param {number} value
 * @returns {Uint8Array}
 */
function u32(value) {
  const view = new Uint8Array(4);
  const data = new DataView(view.buffer);
  data.setUint32(0, value >>> 0, true);
  return view;
}

/**
 * Compute a CRC32 checksum for ZIP file generation.
 * @param {Uint8Array} bytes
 * @returns {number}
 */
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Build a tiny but valid one-page PDF for export.
 * @param {string} title
 * @param {string} body
 * @returns {Uint8Array}
 */
function buildSinglePdfBytes(title, body) {
  const objects = [];
  const add = (content) => {
    objects.push(content);
    return objects.length;
  };

  const escapedBody = body.replace(/[\\()]/g, '\\$&');
  const stream = `BT /F1 18 Tf 72 760 Td (${title.replace(/[\\()]/g, '\\$&')}) Tj T* /F1 12 Tf (${escapedBody}) Tj ET`;

  add('<< /Type /Catalog /Pages 2 0 R >>');
  add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  add(`<< /Length ${utf8(stream).length} >>\nstream\n${stream}\nendstream`);

  const header = '%PDF-1.4\n';
  const chunks = [utf8(header)];
  const offsets = [0];
  let position = header.length;

  objects.forEach((object, index) => {
    const chunk = utf8(`${index + 1} 0 obj\n${object}\nendobj\n`);
    offsets[index + 1] = position;
    chunks.push(chunk);
    position += chunk.length;
  });

  const xrefOffset = position;
  const xrefParts = ['xref\n0 6\n0000000000 65535 f \n'];
  for (let index = 1; index <= 5; index += 1) {
    xrefParts.push(`${String(offsets[index]).padStart(10, '0')} 00000 n \n`);
  }
  xrefParts.push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);
  chunks.push(utf8(xrefParts.join('')));
  return concatBytes(chunks);
}

/**
 * Build a ZIP archive using stored entries only.
 * @param {Array<{name: string, data: Uint8Array}>} entries
 * @returns {Uint8Array}
 */
function buildZipBytes(entries) {
  const localChunks = [];
  const centralChunks = [];
  let localOffset = 0;

  entries.forEach((entry) => {
    const nameBytes = utf8(entry.name);
    const data = entry.data;
    const checksum = crc32(data);

    const localHeader = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(checksum),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      data,
    ]);
    localChunks.push(localHeader);

    const centralHeader = concatBytes([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(checksum),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(localOffset),
      nameBytes,
    ]);
    centralChunks.push(centralHeader);
    localOffset += localHeader.length;
  });

  const centralDirectory = concatBytes(centralChunks);
  const endRecord = concatBytes([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralDirectory.length),
    u32(localOffset),
    u16(0),
  ]);

  return concatBytes([...localChunks, centralDirectory, endRecord]);
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
    error: null,
    custom: {
      jpegQuality: 75,
      maxImageResolution: 150,
      convertToGrayscale: false,
      pageScaleFactor: 100,
      pageScaleFactorLastValid: 100,
    },
  };

  function emit() {
    listeners.forEach((listener) => listener(getState()));
  }

  function clearError() {
    state.error = null;
  }

  function setError(message) {
    state.error = message;
  }

  function notify() {
    emit();
  }

  function getState() {
    const total = state.files.reduce((sum, file) => sum + file.size, 0);
    const current = state.isProcessing
      ? Math.min(state.files.length, Math.max(1, Math.ceil((state.progress / 100) * state.files.length)))
      : 0;

    return {
      files: state.files.map((file, index) => {
        const displayStatus = state.isProcessing
          ? state.progress >= ((index + 1) / state.files.length) * 100
            ? 'Done'
            : state.progress > (index / state.files.length) * 100
              ? 'Processing'
              : 'Queued'
          : file.status;

        return {
          ...file,
          displayStatus,
          statusVariant: getStatusVariant(displayStatus),
        };
      }),
      mode: state.mode,
      isProcessing: state.isProcessing,
      progress: state.progress,
      custom: { ...state.custom },
      summary: {
        count: state.files.length,
        totalSize: total,
        totalSizeLabel: formatBytes(total),
        beforeSizeLabel: formatBytes(total),
        afterSizeLabel: state.result ? formatBytes(state.result.after) : '0 MB',
      },
      result: state.result,
      error: state.error,
      status: {
        variant:
          state.error
            ? 'error'
            : state.isProcessing
              ? 'processing'
              : state.result
                ? 'success'
                : state.files.length > 1
                  ? 'warning'
                  : 'idle',
        top:
          state.error
            ? 'Action needed'
            : state.isProcessing
              ? 'Processing locally'
              : state.result
                ? 'Ready to export'
                : state.files.length > 1
                  ? 'Batch mode ready'
                  : 'Local processing only',
        text:
          state.error
            ? state.error
            : state.isProcessing
              ? `Compressing file ${current} of ${state.files.length}.`
              : state.result
                ? 'Compression finished successfully.'
                : state.files.length
                  ? `${state.files.length} file${state.files.length === 1 ? '' : 's'} ready for compression.`
                  : 'Waiting for files.',
        batch:
          state.error
            ? 'Check the issue and try again'
            : state.isProcessing
              ? `${current}/${state.files.length} files processed`
              : state.result
                ? `${state.result.count} file${state.result.count === 1 ? '' : 's'} ready`
                : state.files.length
                  ? state.files.length > 1
                    ? 'Batch compression ready'
                    : 'Ready to compress'
                  : 'No batch running',
        eta:
          state.error
            ? 'Resolve the error'
            : state.isProcessing
              ? 'Working...'
              : state.result
                ? 'Export available'
                : state.files.length
                  ? 'Choose a preset and compress'
                  : 'Ready',
      },
      canCompress: state.files.length > 0 && !state.isProcessing && !state.error,
      canClear: state.files.length > 0 && !state.isProcessing,
      canExport: Boolean(state.result),
      preset: getPresetCopy(state.mode),
      presetOptions: Object.entries(PRESETS).map(([mode, preset]) => ({
        mode,
        ...preset,
      })),
    };
  }

  /**
   * Add PDF files to the current selection.
   * @param {ArrayLike<{name: string, size?: number, type?: string}>} fileListInput
   */
  function addFiles(fileListInput) {
    const incoming = buildFiles(Array.from(fileListInput).filter((file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name)));
    if (incoming.length === 0) {
      setError('Only PDF files are accepted.');
      notify();
      return;
    }

    clearError();
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
    clearError();
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
    clearError();
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
    clearError();
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
    clearError();
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
    clearError();
    const { value: nextValue, valid } = normalizeScaleFactor(value, state.custom.pageScaleFactorLastValid);
    state.mode = 'custom';
    state.custom = {
      ...state.custom,
      pageScaleFactor: nextValue,
      pageScaleFactorLastValid: valid ? nextValue : state.custom.pageScaleFactorLastValid,
    };
    state.result = null;
    if (!state.isProcessing) {
      state.progress = 0;
    }
    notify();
  }

  /**
   * Start the simulated compression flow for the selected files.
   */
  function compress() {
    if (state.files.length === 0 || state.isProcessing || state.error) return;
    clearError();

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

    const isBatch = state.result.count > 1;
    const files = state.files.length > 0 ? state.files : [{ name: 'compressed', size: state.result.after }];
    const outputName = isBatch ? 'pdf-fasi-compressed.zip' : `${files[0].name.replace(/\.pdf$/i, '')}-compressed.pdf`;

    const bytes = isBatch
      ? buildZipBytes(
        files.map((file, index) => ({
          name: `${file.name.replace(/\.pdf$/i, '')}-compressed.pdf`,
          data: buildSinglePdfBytes(
            `PDF-Fasi compressed export`,
            `${file.name}.pdf - compressed item ${index + 1} of ${files.length}`,
          ),
        })),
      )
      : buildSinglePdfBytes(
        'PDF-Fasi compressed export',
        `${files[0].name}.pdf compressed successfully. Original size: ${formatBytes(state.result.before)}. Output size: ${formatBytes(state.result.after)}.`,
      );

    return {
      type: isBatch ? 'zip' : 'pdf',
      label: isBatch ? 'ZIP export ready' : 'PDF export ready',
      suggestedName: outputName,
      bytes,
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
    compress,
    exportResult,
  };
}
