import { join } from 'path'
import { writeFile, stat, unlink, mkdir, rmdir } from 'proper-fs'
import { createTempDirectory, ITempDirectory } from 'create-temp-directory'
import { IWatchService } from '@file-services/types'
import { sleep, WatchEventsValidator } from '@file-services/test-kit'

import { NodeWatchService } from '../src'

const SAMPLE_CONTENT = `sample file content`

describe('Node Watch Service', function() {
    this.timeout(10000) // override mocha's 2s timeout to 10s

    let tempDir: ITempDirectory
    let watchService: IWatchService

    afterEach('delete temp directory and close watch service', async () => {
        await watchService.unwatchAll()
        await watchService.removeAllListeners()
        await tempDir.remove()
    })

    describe('watching files', () => {
        let validate: WatchEventsValidator
        let testFilePath: string

        beforeEach('create temp fixture file and intialize watcher', async () => {
            watchService = new NodeWatchService()
            validate = new WatchEventsValidator(watchService)

            tempDir = await createTempDirectory()
            testFilePath = join(tempDir.path, 'test-file')

            await writeFile(testFilePath, SAMPLE_CONTENT)
            await watchService.watchPath(testFilePath)
        })

        it('emits watch event when a watched file changes', async () => {
            await writeFile(testFilePath, SAMPLE_CONTENT)

            await validate.nextEvent({ path: testFilePath, stats: await stat(testFilePath) })
            await validate.noMoreEvents()
        })

        it('emits watch event when a watched file is removed', async () => {
            await unlink(testFilePath)

            await validate.nextEvent({ path: testFilePath, stats: null })
            await validate.noMoreEvents()
        })

        it('debounces several consecutive watch events as a single watch event', async () => {
            await writeFile(testFilePath, SAMPLE_CONTENT)
            await writeFile(testFilePath, SAMPLE_CONTENT)
            await writeFile(testFilePath, SAMPLE_CONTENT)

            await validate.nextEvent({ path: testFilePath, stats: await stat(testFilePath) })
            await validate.noMoreEvents()
        })

        it('emits two different watch events when changes are >100ms appart', async () => {
            await writeFile(testFilePath, SAMPLE_CONTENT)
            const firstWriteStats = await stat(testFilePath)

            await sleep(100)

            await writeFile(testFilePath, SAMPLE_CONTENT)

            const secondStats = await stat(testFilePath)

            await validate.nextEvent({ path: testFilePath, stats: firstWriteStats })
            await validate.nextEvent({ path: testFilePath, stats: secondStats })
            await validate.noMoreEvents()
        })

        it('keeps watching if file is deleted and recreated immediately', async () => {
            await writeFile(testFilePath, SAMPLE_CONTENT)
            await unlink(testFilePath)
            await writeFile(testFilePath, SAMPLE_CONTENT)

            await validate.nextEvent({ path: testFilePath, stats: await stat(testFilePath) })

            await writeFile(testFilePath, SAMPLE_CONTENT)

            await validate.nextEvent({ path: testFilePath, stats: await stat(testFilePath) })
            await validate.noMoreEvents()
        })
    })

    describe('watching directories', () => {
        let validate: WatchEventsValidator
        let testDirectoryPath: string

        beforeEach('create temp fixture directory and intialize watcher', async () => {
            watchService = new NodeWatchService()
            validate = new WatchEventsValidator(watchService)

            tempDir = await createTempDirectory()
            testDirectoryPath = join(tempDir.path, 'test-directory')
            await mkdir(testDirectoryPath)
        })

        it('fires a watch event when a watched directory is removed', async () => {
            await watchService.watchPath(testDirectoryPath)

            await rmdir(testDirectoryPath)

            await validate.nextEvent({ path: testDirectoryPath, stats: null })
            await validate.noMoreEvents()
        })

        it('fires a watch event when a file is added inside a watched directory', async () => {
            await watchService.watchPath(testDirectoryPath)

            const testFilePath = join(testDirectoryPath, 'test-file')
            await writeFile(testFilePath, SAMPLE_CONTENT)

            await validate.nextEvent({ path: testFilePath, stats: await stat(testFilePath) })
            await validate.noMoreEvents()
        })

        it('fires a watch event when a file is changed inside inside a watched directory', async () => {
            const testFilePath = join(testDirectoryPath, 'test-file')
            await writeFile(testFilePath, SAMPLE_CONTENT)
            await watchService.watchPath(testDirectoryPath)

            await writeFile(testFilePath, SAMPLE_CONTENT)

            await validate.nextEvent({ path: testFilePath, stats: await stat(testFilePath) })
            await validate.noMoreEvents()
        })

        it('fires a watch event when a file is removed inside inside a watched directory', async () => {
            const testFilePath = join(testDirectoryPath, 'test-file')
            await writeFile(testFilePath, SAMPLE_CONTENT)
            await watchService.watchPath(testDirectoryPath)

            await unlink(testFilePath)

            await validate.nextEvent({ path: testFilePath, stats: null })
            await validate.noMoreEvents()
        })
    })

    describe('mixing watch of directories and files', () => {
        let validate: WatchEventsValidator
        let testDirectoryPath: string
        let testFilePath: string

        beforeEach('create temp fixture directory and intialize watcher', async () => {
            watchService = new NodeWatchService()
            validate = new WatchEventsValidator(watchService)

            tempDir = await createTempDirectory()
            testDirectoryPath = join(tempDir.path, 'test-directory')
            await mkdir(testDirectoryPath)
            testFilePath = join(testDirectoryPath, 'test-file')
            await writeFile(testFilePath, SAMPLE_CONTENT)
        })

        it('allows watching watching a file and its containing directory', async () => {
            await watchService.watchPath(testFilePath)
            await watchService.watchPath(testDirectoryPath)

            await writeFile(testFilePath, SAMPLE_CONTENT)

            await validate.nextEvent({ path: testFilePath, stats: await stat(testFilePath) })
            await validate.noMoreEvents()
        })

        it('allows watching in any order', async () => {
            await watchService.watchPath(testDirectoryPath)
            await watchService.watchPath(testFilePath)

            await writeFile(testFilePath, SAMPLE_CONTENT)

            await validate.nextEvent({ path: testFilePath, stats: await stat(testFilePath) })
            await validate.noMoreEvents()
        })
    })
})