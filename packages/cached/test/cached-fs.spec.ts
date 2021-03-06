import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { asyncBaseFsContract, syncBaseFsContract } from '@file-services/test-kit';
import { createMemoryFs } from '@file-services/memory';
import { createCachedFs } from '../src';
import sinon from 'sinon';

chai.use(chaiAsPromised);

describe('createCachedFs', () => {
    const SAMPLE_CONTENT = 'content';

    describe('Caching absolute paths', () => {
        it('caches statsSync calls', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSyncSpy = sinon.spy(memFs, 'statSync');

            const fs = createCachedFs(memFs);

            const stats = fs.statSync(filePath);
            const stats2 = fs.statSync(filePath);

            expect(stats).to.equal(stats2);
            expect(statSyncSpy.callCount).to.equal(1);
        });

        it('caches statsSync calls if file does not exist', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSyncSpy = sinon.spy(memFs, 'statSync');

            const fs = createCachedFs(memFs);

            try {
                fs.statSync('/no-file');
            } catch (ex) {
                // NO-OP
            }
            try {
                fs.statSync('/no-file');
            } catch (ex) {
                // NO-OP
            }

            expect(statSyncSpy.callCount).to.equal(1);
        });

        it('allows invalidating cache of file path', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSyncSpy = sinon.spy(memFs, 'statSync');

            const fs = createCachedFs(memFs);

            const stats = fs.statSync(filePath);
            fs.invalidate(filePath);
            const stats2 = fs.statSync(filePath);

            expect(stats).to.not.equal(stats2);
            expect(statSyncSpy.callCount).to.equal(2);
        });

        it('allows invalidating cache of non existing file path', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSyncSpy = sinon.spy(memFs, 'statSync');

            const fs = createCachedFs(memFs);

            try {
                fs.statSync(filePath);
            } catch (ex) {
                // NO-OP
            }
            fs.invalidate(filePath);
            try {
                fs.statSync(filePath);
            } catch (ex) {
                // NO-OP
            }

            expect(statSyncSpy.callCount).to.equal(2);
        });

        it('allows invalidating cache of all file paths', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSyncSpy = sinon.spy(memFs, 'statSync');

            const fs = createCachedFs(memFs);

            const stats = fs.statSync(filePath);
            fs.invalidateAll();
            const stats2 = fs.statSync(filePath);

            expect(stats).to.not.equal(stats2);
            expect(statSyncSpy.callCount).to.equal(2);
        });

        it('caches statsSync calls - through fileExists', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSyncSpy = sinon.spy(memFs, 'statSync');

            const fs = createCachedFs(memFs);

            const exists = fs.fileExistsSync(filePath);
            const exists2 = fs.fileExistsSync(filePath);

            expect(exists).to.equal(exists2);
            expect(statSyncSpy.callCount).to.equal(1);
        });

        it('caches statsSync calls - through fileExists - when not existing', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSyncSpy = sinon.spy(memFs, 'statSync');

            const fs = createCachedFs(memFs);

            const exists = fs.fileExistsSync('/no-file');
            const exists2 = fs.fileExistsSync('/no-file');

            expect(exists).to.equal(exists2);
            expect(statSyncSpy.callCount).to.equal(1);
        });

        it('caches stats (callback-style) calls', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSpy = sinon.spy(memFs, 'stat');

            const fs = createCachedFs(memFs);

            const stats = await new Promise((res, rej) =>
                fs.stat(filePath, (error, value) => (error ? rej(error) : res(value)))
            );

            const stats2 = await new Promise((res, rej) =>
                fs.stat(filePath, (error, value) => (error ? rej(error) : res(value)))
            );

            expect(stats).to.equal(stats2);
            expect(statSpy.callCount).to.equal(1);
        });

        it('caches stats (callback-style) calls', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSpy = sinon.spy(memFs, 'stat');

            const fs = createCachedFs(memFs);

            try {
                await new Promise((res, rej) =>
                    fs.stat('/no-file', (error, value) => (error ? rej(error) : res(value)))
                );
            } catch (ex) {
                // NO-OP
            }

            try {
                await new Promise((res, rej) =>
                    fs.stat('/no-file', (error, value) => (error ? rej(error) : res(value)))
                ).catch();
            } catch (ex) {
                // NO-OP
            }

            expect(statSpy.callCount).to.equal(1);
        });

        it('caches promises.stat calls', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSpy = sinon.spy(memFs.promises, 'stat');

            const fs = createCachedFs(memFs);

            const stats = await fs.promises.stat(filePath);

            const stats2 = await fs.promises.stat(filePath);

            expect(stats).to.equal(stats2);
            expect(statSpy.callCount).to.equal(1);
        });

        it('caches promises.stat calls - non-existing files', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSpy = sinon.spy(memFs.promises, 'stat');

            const fs = createCachedFs(memFs);

            try {
                await fs.promises.stat('/no-file');
            } catch (ex) {
                // NO-OP
            }
            try {
                await fs.promises.stat('/no-file');
            } catch (ex) {
                // NO-OP
            }

            expect(statSpy.callCount).to.equal(1);
        });

        it('allows invalidating cache of file path (callback-style version)', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSpy = sinon.spy(memFs, 'stat');

            const fs = createCachedFs(memFs);

            const stats = await new Promise((res, rej) =>
                fs.stat(filePath, (error, value) => (error ? rej(error) : res(value)))
            );

            fs.invalidate(filePath);

            const stats2 = await new Promise((res, rej) =>
                fs.stat(filePath, (error, value) => (error ? rej(error) : res(value)))
            );

            expect(stats).to.not.equal(stats2);
            expect(statSpy.callCount).to.equal(2);
        });

        it('allows invalidating cache of non-existing file path (callback-style version)', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSpy = sinon.spy(memFs, 'stat');

            const fs = createCachedFs(memFs);

            try {
                await new Promise((res, rej) =>
                    fs.stat('/no-file', (error, value) => (error ? rej(error) : res(value)))
                );
            } catch (ex) {
                // NO-OP
            }

            fs.invalidate('/no-file');

            try {
                await new Promise((res, rej) =>
                    fs.stat('/no-file', (error, value) => (error ? rej(error) : res(value)))
                );
            } catch (ex) {
                // NO-OP
            }

            expect(statSpy.callCount).to.equal(2);
        });

        it('allows invalidating cache of all file paths (callback-style version)', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSpy = sinon.spy(memFs, 'stat');

            const fs = createCachedFs(memFs);

            const stats = await new Promise((res, rej) =>
                fs.stat(filePath, (error, value) => (error ? rej(error) : res(value)))
            );

            fs.invalidateAll();

            const stats2 = await new Promise((res, rej) =>
                fs.stat(filePath, (error, value) => (error ? rej(error) : res(value)))
            );

            expect(stats).to.not.equal(stats2);
            expect(statSpy.callCount).to.equal(2);
        });
    });

    describe('Caching absolute + relative paths', () => {
        it('caches statsSync calls with relative variations', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSyncSpy = sinon.spy(memFs, 'statSync');

            const fs = createCachedFs(memFs);

            const stats = fs.statSync(filePath);
            const stats2 = fs.statSync('file');
            const stats3 = fs.statSync('./file');

            expect(stats).to.equal(stats2);
            expect(stats2).to.equal(stats3);
            expect(statSyncSpy.callCount).to.equal(1);
        });

        it('caches statsSync calls with relative variations of non-existing files', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSyncSpy = sinon.spy(memFs, 'statSync');

            const fs = createCachedFs(memFs);

            try {
                fs.statSync('/no-file');
            } catch (ex) {
                // NO-OP
            }
            try {
                fs.statSync('no-file');
            } catch (ex) {
                // NO-OP
            }
            try {
                fs.statSync('./no-file');
            } catch (ex) {
                // NO-OP
            }

            expect(statSyncSpy.callCount).to.equal(1);
        });

        it('allows invalidating cache of file path', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSyncSpy = sinon.spy(memFs, 'statSync');

            const fs = createCachedFs(memFs);

            const stats = fs.statSync(filePath);
            fs.invalidate(filePath);
            const stats2 = fs.statSync('file');
            fs.invalidate(filePath);
            const stats3 = fs.statSync('./file');

            expect(stats).to.not.equal(stats2);
            expect(stats2).to.not.equal(stats3);
            expect(statSyncSpy.callCount).to.equal(3);
        });

        it('allows invalidating cache of non-existing file path', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSyncSpy = sinon.spy(memFs, 'statSync');

            const fs = createCachedFs(memFs);
            try {
                fs.statSync('/no-file');
            } catch (ex) {
                // NO-OP
            }
            fs.invalidate('/no-file');
            try {
                fs.statSync('no-file');
            } catch (ex) {
                // NO-OP
            }

            fs.invalidate('/no-file');
            try {
                fs.statSync('./no-file');
            } catch (ex) {
                // NO-OP
            }

            expect(statSyncSpy.callCount).to.equal(3);
        });

        it('allows invalidating cache of all file paths', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSyncSpy = sinon.spy(memFs, 'statSync');

            const fs = createCachedFs(memFs);

            const stats = fs.statSync(filePath);
            fs.invalidateAll();
            const stats2 = fs.statSync('file');
            fs.invalidateAll();
            const stats3 = fs.statSync('./file');

            expect(stats).to.not.equal(stats2);
            expect(stats2).to.not.equal(stats3);
            expect(statSyncSpy.callCount).to.equal(3);
        });

        it('caches statsSync calls - through fileExists', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSyncSpy = sinon.spy(memFs, 'statSync');

            const fs = createCachedFs(memFs);

            const exists = fs.fileExistsSync(filePath);
            const exists2 = fs.fileExistsSync('file');
            const exists3 = fs.fileExistsSync('./file');

            expect(exists).to.equal(exists2);
            expect(exists2).to.equal(exists3);
            expect(statSyncSpy.callCount).to.equal(1);
        });

        it('caches stats (callback-style) calls', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSpy = sinon.spy(memFs, 'stat');

            const fs = createCachedFs(memFs);

            const stats = await new Promise((res, rej) =>
                fs.stat(filePath, (error, value) => (error ? rej(error) : res(value)))
            );

            const stats2 = await new Promise((res, rej) =>
                fs.stat('file', (error, value) => (error ? rej(error) : res(value)))
            );

            const stats3 = await new Promise((res, rej) =>
                fs.stat('./file', (error, value) => (error ? rej(error) : res(value)))
            );

            expect(stats).to.equal(stats2);
            expect(stats2).to.equal(stats3);
            expect(statSpy.callCount).to.equal(1);
        });

        it('allows invalidating cache of file path (callback-style version)', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSpy = sinon.spy(memFs, 'stat');

            const fs = createCachedFs(memFs);

            const stats = await new Promise((res, rej) =>
                fs.stat(filePath, (error, value) => (error ? rej(error) : res(value)))
            );

            fs.invalidate(filePath);

            const stats2 = await new Promise((res, rej) =>
                fs.stat('file', (error, value) => (error ? rej(error) : res(value)))
            );

            fs.invalidate('./file');

            const stats3 = await new Promise((res, rej) =>
                fs.stat('./file', (error, value) => (error ? rej(error) : res(value)))
            );

            expect(stats).to.not.equal(stats2);
            expect(stats2).to.not.equal(stats3);
            expect(statSpy.callCount).to.equal(3);
        });

        it('allows invalidating cache of all file paths (callback-style version)', async () => {
            const filePath = '/file';
            const memFs = createMemoryFs({ [filePath]: SAMPLE_CONTENT });

            const statSpy = sinon.spy(memFs, 'stat');

            const fs = createCachedFs(memFs);

            const stats = await new Promise((res, rej) =>
                fs.stat(filePath, (error, value) => (error ? rej(error) : res(value)))
            );

            fs.invalidateAll();

            const stats2 = await new Promise((res, rej) =>
                fs.stat('file', (error, value) => (error ? rej(error) : res(value)))
            );

            fs.invalidateAll();

            const stats3 = await new Promise((res, rej) =>
                fs.stat('./file', (error, value) => (error ? rej(error) : res(value)))
            );

            expect(stats).to.not.equal(stats2);
            expect(stats2).to.not.equal(stats3);
            expect(statSpy.callCount).to.equal(3);
        });
    });

    const testProvider = async () => {
        const fs = createCachedFs(createMemoryFs());
        fs.watchService.addGlobalListener(ev => fs.invalidate(ev.path));
        return {
            fs,
            dispose: async () => undefined,
            tempDirectoryPath: fs.cwd()
        };
    };

    asyncBaseFsContract(testProvider);
    syncBaseFsContract(testProvider);
});
