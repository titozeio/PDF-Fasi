import test from 'node:test';
import assert from 'node:assert/strict';
import { createCompressionViewModel } from '../src/viewModel.mjs';

function createFakeTimers() {
  let callback = null;
  return {
    setIntervalFn(fn) {
      callback = fn;
      return 1;
    },
    clearIntervalFn() {
      callback = null;
    },
    tick(times = 1) {
      for (let index = 0; index < times; index += 1) {
        if (!callback) break;
        callback();
      }
    },
  };
}

test('compression view model accepts files and updates selection state', () => {
  const vm = createCompressionViewModel();
  let latest;

  vm.subscribe((state) => {
    latest = state;
  });

  vm.addFiles([
    { name: 'report.pdf', size: 4_000_000, type: 'application/pdf' },
    { name: 'notes.txt', size: 2_000_000, type: 'text/plain' },
  ]);

  assert.equal(latest.files.length, 1);
  assert.equal(latest.summary.count, 1);
  assert.equal(latest.status.text, '1 file ready for compression.');
  assert.equal(latest.canCompress, true);

  vm.setMode('custom');
  vm.updateCustom({ imageCompression: 80, resolution: 120, targetSize: 40 });

  assert.equal(latest.mode, 'custom');
  assert.equal(latest.custom.imageCompression, 80);
  assert.equal(latest.custom.resolution, 120);
  assert.equal(latest.custom.targetSize, 40);
});

test('compression view model supports removing and clearing files', () => {
  const vm = createCompressionViewModel();
  let latest;

  vm.subscribe((state) => {
    latest = state;
  });

  vm.addFiles([
    { name: 'one.pdf', size: 2_000_000, type: 'application/pdf' },
    { name: 'two.pdf', size: 3_000_000, type: 'application/pdf' },
  ]);

  const removedId = latest.files[0].id;
  vm.removeFile(removedId);

  assert.equal(latest.files.length, 1);
  assert.equal(latest.summary.count, 1);

  vm.clearFiles();

  assert.equal(latest.files.length, 0);
  assert.equal(latest.summary.count, 0);
  assert.equal(latest.canCompress, false);
});

test('compression view model exposes the preset catalog and applies preset factors', () => {
  const vm = createCompressionViewModel();
  let latest;

  vm.subscribe((state) => {
    latest = state;
  });

  assert.deepEqual(
    latest.presetOptions.map((preset) => preset.mode),
    ['print', 'ebook', 'screen', 'custom'],
  );
  assert.equal(latest.preset.label, 'Ebook');

  vm.addFiles([{ name: 'sample.pdf', size: 10_000_000, type: 'application/pdf' }]);
  vm.setMode('print');

  const fastPreset = latest.preset;
  vm.setMode('screen');
  const highPreset = latest.preset;

  assert.equal(fastPreset.factor > highPreset.factor, true);
  assert.equal(fastPreset.label, 'Print');
  assert.equal(highPreset.label, 'Screen');
});

test('compression view model clamps and recovers custom page scale factor', () => {
  const vm = createCompressionViewModel();
  let latest;

  vm.subscribe((state) => {
    latest = state;
  });

  vm.setPageScaleFactor(135);
  assert.equal(latest.custom.pageScaleFactor, 135);

  vm.setPageScaleFactor(999);
  assert.equal(latest.custom.pageScaleFactor, 200);

  vm.setPageScaleFactor('invalid');
  assert.equal(latest.custom.pageScaleFactor, 200);

  vm.setPageScaleFactor('');
  assert.equal(latest.custom.pageScaleFactor, 200);
});

test('compression view model accepts custom JPEG quality and grayscale controls', () => {
  const vm = createCompressionViewModel();
  let latest;

  vm.subscribe((state) => {
    latest = state;
  });

  vm.updateCustom({
    jpegQuality: 80,
    maxImageResolution: 'keep-original',
    convertToGrayscale: true,
  });

  assert.equal(latest.mode, 'custom');
  assert.equal(latest.custom.jpegQuality, 80);
  assert.equal(latest.custom.maxImageResolution, 'keep-original');
  assert.equal(latest.custom.convertToGrayscale, true);
  assert.equal(latest.preset.label, 'Custom');
});

test('compression view model completes a single-file compression flow', () => {
  const timers = createFakeTimers();
  const vm = createCompressionViewModel(timers);
  let latest;

  vm.subscribe((state) => {
    latest = state;
  });

  vm.addFiles([{ name: 'brochure.pdf', size: 5_000_000, type: 'application/pdf' }]);
  vm.compress();
  timers.tick(10);

  assert.equal(latest.isProcessing, false);
  assert.equal(latest.progress, 100);
  assert.equal(latest.result.count, 1);
  assert.equal(latest.status.top, 'Ready to export');
  assert.equal(vm.exportResult().type, 'pdf');
  assert.equal(latest.canExport, true);
});

test('compression view model exports a zip for batch compression', () => {
  const timers = createFakeTimers();
  const vm = createCompressionViewModel(timers);
  let latest;

  vm.subscribe((state) => {
    latest = state;
  });

  vm.addFiles([
    { name: 'one.pdf', size: 3_500_000, type: 'application/pdf' },
    { name: 'two.pdf', size: 4_500_000, type: 'application/pdf' },
  ]);
  vm.setMode('screen');
  vm.compress();
  timers.tick(15);

  assert.equal(latest.result.count, 2);
  assert.equal(vm.exportResult().type, 'zip');
  assert.equal(latest.files.every((file) => file.displayStatus === 'Done'), true);
});
