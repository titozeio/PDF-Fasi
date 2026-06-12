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
  vm.setMode('fast');
  vm.compress();
  timers.tick(15);

  assert.equal(latest.result.count, 2);
  assert.equal(vm.exportResult().type, 'zip');
  assert.equal(latest.files.every((file) => file.displayStatus === 'Done'), true);
});
